<script lang="ts">
	import { authStore } from '$lib/auth.svelte';
	import { db } from '$lib/firebase';
	import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
	import { goto } from '$app/navigation';

	type ScrapeJob = {
		id: string;
		url: string;
		pattern: string;
		email: string;
		delay: string;
		createdAt: number;
		active: boolean;
	};

	let jobs = $state<ScrapeJob[]>([]);
	let jobsLoading = $state(true);
	let deletingId = $state<string | null>(null);

	let unsubscribeJobs: (() => void) | null = null;

	$effect(() => {
		// Wait for Firebase to finish restoring session before deciding to redirect
		if (authStore.loading) return;

		if (!authStore.user) {
			goto('/login');
			return;
		}

		// Subscribe to jobs once we know the user
		const uid = authStore.user.uid;
		const q = query(collection(db, `users/${uid}/jobs`), orderBy('createdAt', 'desc'));
		unsubscribeJobs = onSnapshot(q, (snap) => {
			jobs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ScrapeJob, 'id'>) }));
			jobsLoading = false;
		});

		return () => unsubscribeJobs?.();
	});

	async function deleteJob(id: string) {
		if (!authStore.user) return;
		deletingId = id;
		try {
			await deleteDoc(doc(db, `users/${authStore.user.uid}/jobs/${id}`));
		} finally {
			deletingId = null;
		}
	}

	const DELAY_LABELS: Record<string, string> = {
		'15m': 'Every 15 min',
		'1h': 'Every hour',
		'6h': 'Every 6 hours',
		'24h': 'Once a day'
	};
</script>

<div class="dashboard">
	<div class="dashboard-header">
		<div>
			<h1 class="page-title">Scrape Jobs</h1>
			<p class="page-subtitle">Your active monitoring jobs</p>
		</div>
		<a href="/jobs/new" class="btn-primary">
			<span>＋</span> New Job
		</a>
	</div>

	{#if authStore.loading}
	<div class="state-box">
		<div class="spinner"></div>
	</div>
{:else if jobsLoading}
		<div class="state-box">
			<div class="spinner"></div>
			<p>Loading your jobs…</p>
		</div>
	{:else if jobs.length === 0}
		<div class="state-box empty">
			<div class="empty-icon">🔍</div>
			<h2 class="empty-title">No jobs yet</h2>
			<p class="empty-text">
				Create your first scrape job to start monitoring URLs for pattern matches.
			</p>
			<a href="/jobs/new" class="btn-primary">Create your first job</a>
		</div>
	{:else}
		<div class="jobs-grid">
			{#each jobs as job (job.id)}
				<div class="job-card">
					<div class="job-card-header">
						<span class="job-status" class:active={job.active}>
							<span class="status-dot"></span>
							{job.active ? 'Active' : 'Paused'}
						</span>
						<span class="job-delay">{DELAY_LABELS[job.delay] ?? job.delay}</span>
					</div>

					<div class="job-url" title={job.url}>
						<span class="field-icon">🌐</span>
						<span class="truncate">{job.url}</span>
					</div>

					<div class="job-detail">
						<span class="field-icon">🔎</span>
						<code class="pattern-code">{job.pattern}</code>
					</div>

					<div class="job-detail">
						<span class="field-icon">✉</span>
						<span class="job-email">{job.email}</span>
					</div>

					<div class="job-card-footer">
						<span class="job-created">
							Created {new Date(job.createdAt).toLocaleDateString()}
						</span>
						<button
							class="btn-delete"
							disabled={deletingId === job.id}
							onclick={() => deleteJob(job.id)}
						>
							{deletingId === job.id ? '…' : 'Delete'}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.dashboard-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2.5rem;
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

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		padding: 0.65rem 1.25rem;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
		white-space: nowrap;
	}

	.btn-primary:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 20px var(--accent-glow);
		text-decoration: none;
		color: #fff;
	}

	.state-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 300px;
		color: var(--text-secondary);
	}

	.empty {
		border: 1px dashed var(--border);
		border-radius: var(--radius);
		padding: 3rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.empty-title {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.empty-text {
		max-width: 340px;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.jobs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 1.25rem;
	}

	.job-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
	}

	.job-card:hover {
		border-color: #3a3a55;
		box-shadow: var(--shadow);
		transform: translateY(-2px);
	}

	.job-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.job-status {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.job-status.active {
		color: var(--success);
	}

	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: currentColor;
	}

	.job-status.active .status-dot {
		animation: pulse 2s ease infinite;
		box-shadow: 0 0 0 0 currentColor;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
		}
		70% {
			box-shadow: 0 0 0 6px transparent;
		}
		100% {
			box-shadow: 0 0 0 0 transparent;
		}
	}

	.job-delay {
		font-size: 0.78rem;
		color: var(--text-muted);
		background: var(--bg-secondary);
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		border: 1px solid var(--border);
	}

	.job-url,
	.job-detail {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		overflow: hidden;
	}

	.job-url {
		color: var(--text-primary);
		font-weight: 500;
	}

	.field-icon {
		flex-shrink: 0;
		font-size: 0.85rem;
	}

	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pattern-code {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.825rem;
		background: var(--bg-secondary);
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		color: #a78bfa;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.job-email {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.job-card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border);
		margin-top: 0.25rem;
	}

	.job-created {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.btn-delete {
		background: transparent;
		border: 1px solid transparent;
		color: var(--text-muted);
		font-size: 0.8rem;
		padding: 0.25rem 0.6rem;
		border-radius: var(--radius-sm);
		transition: all 0.15s;
	}

	.btn-delete:hover:not(:disabled) {
		border-color: var(--danger);
		color: var(--danger);
		background: rgba(239, 68, 68, 0.08);
	}

	.btn-delete:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
