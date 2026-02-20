<script lang="ts">
	import { authStore } from '$lib/auth.svelte';
	import { db } from '$lib/firebase';
	import {
		collection,
		onSnapshot,
		query,
		orderBy,
		limit,
		type Unsubscribe
	} from 'firebase/firestore';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		Chart,
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		LineController,
		LineElement,
		PointElement,
		Filler
	} from 'chart.js';

	Chart.register(
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		LineController,
		LineElement,
		PointElement,
		Filler
	);

	// ---- types ----
	type ScrapeJob = { id: string; url: string; pattern: string; email: string; delay: string };
	type ScrapeResult = {
		id: string;
		timestamp: number;
		matched: boolean;
		matchCount: number;
		error: string | null;
	};

	// ---- state ----
	let jobs = $state<ScrapeJob[]>([]);
	let selectedJobId = $state<string>($page.url.searchParams.get('job') ?? '');
	let results = $state<ScrapeResult[]>([]);
	let jobsLoading = $state(true);
	let resultsLoading = $state(false);

	// chart canvas refs
	let timelineCanvas = $state<HTMLCanvasElement | null>(null);
	let rateCanvas = $state<HTMLCanvasElement | null>(null);
	let timelineChart: Chart | null = null;
	let rateChart: Chart | null = null;

	let unsubJobs: Unsubscribe | null = null;
	let unsubResults: Unsubscribe | null = null;

	// ---- auth guard ----
	$effect(() => {
		if (!authStore.loading && !authStore.user) goto('/login');
	});

	// ---- load jobs list ----
	$effect(() => {
		if (authStore.loading || !authStore.user) return;
		const uid = authStore.user.uid;
		unsubJobs?.();
		unsubJobs = onSnapshot(
			query(collection(db, `users/${uid}/jobs`), orderBy('createdAt', 'desc')),
			(snap) => {
				jobs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ScrapeJob, 'id'>) }));
				jobsLoading = false;
				// auto-select first job if none chosen
				if (!selectedJobId && jobs.length > 0) selectedJobId = jobs[0].id;
			}
		);
		return () => unsubJobs?.();
	});

	// ---- load results for selected job ----
	$effect(() => {
		if (!selectedJobId || !authStore.user) return;
		resultsLoading = true;
		unsubResults?.();
		const uid = authStore.user.uid;
		unsubResults = onSnapshot(
			query(
				collection(db, `users/${uid}/jobs/${selectedJobId}/results`),
				orderBy('timestamp', 'asc'),
				limit(100)
			),
			(snap) => {
				results = snap.docs.map((d) => ({
					id: d.id,
					...(d.data() as Omit<ScrapeResult, 'id'>)
				}));
				resultsLoading = false;
				renderCharts();
			}
		);
		return () => unsubResults?.();
	});

	// ---- keep URL in sync ----
	$effect(() => {
		if (selectedJobId) {
			const url = new URL(window.location.href);
			url.searchParams.set('job', selectedJobId);
			history.replaceState({}, '', url.toString());
		}
	});

	// ---- derived stats ----
	const totalRuns = $derived(results.length);
	const successfulRuns = $derived(results.filter((r) => r.matched).length);
	const errorRuns = $derived(results.filter((r) => r.error).length);
	const successRate = $derived(totalRuns ? Math.round((successfulRuns / totalRuns) * 100) : 0);
	const selectedJob = $derived(jobs.find((j) => j.id === selectedJobId));

	function formatTime(ts: number) {
		const d = new Date(ts);
		return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) +
			' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	}

	function renderCharts() {
		if (!timelineCanvas || !rateCanvas) return;

		// destroy previous instances
		timelineChart?.destroy();
		rateChart?.destroy();

		const labels = results.map((r) => formatTime(r.timestamp));

		// ---- timeline bar chart ----
		timelineChart = new Chart(timelineCanvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Pattern matched',
						data: results.map((r) => (r.matched ? 1 : 0)),
						backgroundColor: 'rgba(99,102,241,0.75)',
						borderColor: '#6366f1',
						borderWidth: 1,
						borderRadius: 4
					},
					{
						label: 'No match',
						data: results.map((r) => (!r.matched && !r.error ? 1 : 0)),
						backgroundColor: 'rgba(90,90,114,0.45)',
						borderColor: 'rgba(90,90,114,0.8)',
						borderWidth: 1,
						borderRadius: 4
					},
					{
						label: 'Error',
						data: results.map((r) => (r.error ? 1 : 0)),
						backgroundColor: 'rgba(239,68,68,0.65)',
						borderColor: '#ef4444',
						borderWidth: 1,
						borderRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						stacked: true,
						ticks: { color: '#9898b0', maxTicksLimit: 12, maxRotation: 30 },
						grid: { color: 'rgba(42,42,61,0.6)' }
					},
					y: {
						stacked: true,
						max: 1,
						ticks: { color: '#9898b0', stepSize: 1 },
						grid: { color: 'rgba(42,42,61,0.6)' }
					}
				},
				plugins: {
					legend: { labels: { color: '#9898b0', boxWidth: 12, font: { size: 12 } } },
					tooltip: {
						callbacks: {
							label: (ctx) => {
								const r = results[ctx.dataIndex];
								if (ctx.datasetIndex === 0 && r.matched)
									return ` Matched (${r.matchCount ?? 1} occurrence${(r.matchCount ?? 1) !== 1 ? 's' : ''})`;
								if (ctx.datasetIndex === 1 && !r.matched && !r.error) return ' No match found';
								if (ctx.datasetIndex === 2 && r.error) return ` Error: ${r.error}`;
								return '';
							}
						}
					}
				}
			}
		});

		// ---- rolling success-rate line chart ----
		// compute rolling 7-run success %
		const rolling = results.map((_, i) => {
			const window = results.slice(Math.max(0, i - 6), i + 1);
			const hits = window.filter((r) => r.matched).length;
			return Math.round((hits / window.length) * 100);
		});

		rateChart = new Chart(rateCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Match rate (7-run rolling %)',
						data: rolling,
						borderColor: '#6366f1',
						backgroundColor: 'rgba(99,102,241,0.12)',
						borderWidth: 2,
						pointRadius: 3,
						pointBackgroundColor: '#6366f1',
						fill: true,
						tension: 0.35
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						ticks: { color: '#9898b0', maxTicksLimit: 12, maxRotation: 30 },
						grid: { color: 'rgba(42,42,61,0.6)' }
					},
					y: {
						min: 0,
						max: 100,
						ticks: { color: '#9898b0', callback: (v) => v + '%' },
						grid: { color: 'rgba(42,42,61,0.6)' }
					}
				},
				plugins: {
					legend: { labels: { color: '#9898b0', boxWidth: 12, font: { size: 12 } } },
					tooltip: {
						callbacks: { label: (ctx) => ` ${ctx.parsed.y}%` }
					}
				}
			}
		});
	}

	// re-render when canvas element appears
	$effect(() => {
		if (timelineCanvas && rateCanvas && results.length > 0) renderCharts();
	});

	onMount(() => () => {
		timelineChart?.destroy();
		rateChart?.destroy();
		unsubJobs?.();
		unsubResults?.();
	});
</script>

<div class="analytics">
	<!-- Header -->
	<div class="page-header">
		<div>
			<h1 class="page-title">Analytics</h1>
			<p class="page-subtitle">Scrape run history and match rates</p>
		</div>

		<!-- Job selector -->
		{#if !jobsLoading && jobs.length > 0}
			<div class="job-selector">
				<label for="job-select" class="selector-label">Job</label>
				<div class="select-wrapper">
					<select
						id="job-select"
						class="field-select"
						bind:value={selectedJobId}
					>
						{#each jobs as job}
							<option value={job.id}>{job.url}</option>
						{/each}
					</select>
					<span class="select-arrow">▾</span>
				</div>
			</div>
		{/if}
	</div>

	{#if authStore.loading || jobsLoading}
		<div class="state-box"><div class="spinner"></div></div>
	{:else if jobs.length === 0}
		<div class="state-box empty">
			<div class="empty-icon">📭</div>
			<h2>No jobs yet</h2>
			<p>Create a scrape job first, then come back to see its stats.</p>
			<a href="/jobs/new" class="btn-primary">Create a job</a>
		</div>
	{:else if selectedJob}
		<!-- Job info strip -->
		<div class="job-strip">
			<div class="job-strip-detail">
				<span class="strip-label">URL</span>
				<span class="strip-value truncate">{selectedJob.url}</span>
			</div>
			<div class="job-strip-detail">
				<span class="strip-label">Pattern</span>
				<code class="pattern-code">{selectedJob.pattern}</code>
			</div>
			<div class="job-strip-detail">
				<span class="strip-label">Frequency</span>
				<span class="strip-value">{selectedJob.delay}</span>
			</div>
		</div>

		<!-- Stat cards -->
		<div class="stat-cards">
			<div class="stat-card">
				<span class="stat-label">Total runs</span>
				<span class="stat-value">{totalRuns}</span>
			</div>
			<div class="stat-card stat-card--success">
				<span class="stat-label">Matched</span>
				<span class="stat-value">{successfulRuns}</span>
			</div>
			<div class="stat-card stat-card--danger">
				<span class="stat-label">Errors</span>
				<span class="stat-value">{errorRuns}</span>
			</div>
			<div class="stat-card stat-card--accent">
				<span class="stat-label">Match rate</span>
				<span class="stat-value">{successRate}%</span>
			</div>
		</div>

		{#if resultsLoading}
			<div class="state-box"><div class="spinner"></div></div>
		{:else if results.length === 0}
			<div class="state-box empty subtle">
				<div class="empty-icon">🕐</div>
				<h2>No runs yet</h2>
				<p>The backend hasn't recorded any scrape results for this job yet.</p>
			</div>
		{:else}
			<!-- Charts -->
			<div class="charts">
				<div class="chart-card">
					<div class="chart-header">
						<h2 class="chart-title">Scrape runs over time</h2>
						<span class="chart-hint">Each bar = one scrape run</span>
					</div>
					<div class="chart-body">
						<canvas bind:this={timelineCanvas}></canvas>
					</div>
				</div>

				<div class="chart-card">
					<div class="chart-header">
						<h2 class="chart-title">Rolling match rate</h2>
						<span class="chart-hint">7-run rolling average</span>
					</div>
					<div class="chart-body">
						<canvas bind:this={rateCanvas}></canvas>
					</div>
				</div>
			</div>

			<!-- Recent runs table -->
			<div class="table-card">
				<div class="table-header">
					<h2 class="chart-title">Recent runs</h2>
				</div>
				<div class="table-scroll">
					<table>
						<thead>
							<tr>
								<th>Time</th>
								<th>Result</th>
								<th>Details</th>
							</tr>
						</thead>
						<tbody>
							{#each [...results].reverse().slice(0, 50) as r}
								<tr>
									<td class="td-time">{formatTime(r.timestamp)}</td>
									<td>
										{#if r.error}
											<span class="badge badge--error">Error</span>
										{:else if r.matched}
											<span class="badge badge--matched">Matched</span>
										{:else}
											<span class="badge badge--empty">No match</span>
										{/if}
									</td>
									<td class="td-detail">
										{#if r.error}
											<span class="detail-error">{r.error}</span>
										{:else if r.matched}
											{r.matchCount ?? 1} occurrence{(r.matchCount ?? 1) !== 1 ? 's' : ''}
										{:else}
											—
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.analytics {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* ---- header ---- */
	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		margin-bottom: 0.2rem;
	}

	.page-subtitle {
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	/* ---- job selector ---- */
	.job-selector {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		flex-shrink: 0;
	}

	.selector-label {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.select-wrapper {
		position: relative;
	}

	.field-select {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.5rem 2.2rem 0.5rem 0.85rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		appearance: none;
		cursor: pointer;
		outline: none;
		max-width: 320px;
		transition: border-color 0.15s;
	}

	.field-select:focus {
		border-color: var(--border-focus);
	}

	.select-arrow {
		position: absolute;
		right: 0.65rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--text-muted);
		font-size: 0.75rem;
	}

	/* ---- job strip ---- */
	.job-strip {
		display: flex;
		gap: 0;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		flex-wrap: wrap;
	}

	.job-strip-detail {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.9rem 1.25rem;
		flex: 1;
		min-width: 180px;
		border-right: 1px solid var(--border);
	}

	.job-strip-detail:last-child {
		border-right: none;
	}

	.strip-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-muted);
	}

	.strip-value {
		font-size: 0.875rem;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pattern-code {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.8rem;
		color: #a78bfa;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ---- stat cards ---- */
	.stat-cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	@media (max-width: 700px) {
		.stat-cards {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.stat-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.stat-card--success { border-color: rgba(34,197,94,0.25); }
	.stat-card--danger  { border-color: rgba(239,68,68,0.25); }
	.stat-card--accent  { border-color: rgba(99,102,241,0.35); }

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-muted);
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		letter-spacing: -0.04em;
		color: var(--text-primary);
	}

	.stat-card--success .stat-value { color: #4ade80; }
	.stat-card--danger  .stat-value { color: #f87171; }
	.stat-card--accent  .stat-value { color: #818cf8; }

	/* ---- charts ---- */
	.charts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 900px) {
		.charts { grid-template-columns: 1fr; }
	}

	.chart-card, .table-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.chart-header, .table-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 1rem 1.25rem 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.chart-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.chart-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.chart-body {
		padding: 1.25rem;
		height: 240px;
		position: relative;
	}

	.chart-body canvas {
		width: 100% !important;
		height: 100% !important;
	}

	/* ---- table ---- */
	.table-scroll {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	thead th {
		text-align: left;
		padding: 0.65rem 1.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border);
		background: var(--bg-secondary);
	}

	tbody tr {
		border-bottom: 1px solid var(--border);
		transition: background 0.1s;
	}

	tbody tr:last-child { border-bottom: none; }
	tbody tr:hover { background: var(--bg-card-hover); }

	tbody td {
		padding: 0.65rem 1.25rem;
		color: var(--text-secondary);
		vertical-align: middle;
	}

	.td-time {
		color: var(--text-muted);
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.td-detail { color: var(--text-secondary); font-size: 0.85rem; }
	.detail-error { color: #f87171; }

	/* ---- badges ---- */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
	}

	.badge--matched {
		background: rgba(34,197,94,0.12);
		color: #4ade80;
		border: 1px solid rgba(34,197,94,0.25);
	}

	.badge--error {
		background: rgba(239,68,68,0.12);
		color: #f87171;
		border: 1px solid rgba(239,68,68,0.25);
	}

	.badge--empty {
		background: rgba(90,90,114,0.2);
		color: var(--text-muted);
		border: 1px solid var(--border);
	}

	/* ---- states ---- */
	.state-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 260px;
		color: var(--text-secondary);
		text-align: center;
	}

	.empty { border: 1px dashed var(--border); border-radius: var(--radius); padding: 3rem; }
	.subtle { border-style: solid; background: var(--bg-card); min-height: 180px; }

	.empty-icon { font-size: 2.5rem; }

	.empty h2 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.empty p { font-size: 0.875rem; color: var(--text-secondary); }

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		padding: 0.6rem 1.25rem;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.15s;
	}

	.btn-primary:hover { background: var(--accent-hover); color: #fff; text-decoration: none; }

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin { to { transform: rotate(360deg); } }
</style>
