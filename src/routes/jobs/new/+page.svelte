<script lang="ts">
	import { authStore } from '$lib/auth.svelte';
	import { db } from '$lib/firebase';
	import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	$effect(() => {
		if (!authStore.loading && !authStore.user) goto('/login');
	});

	let url = $state('');
	let pattern = $state('');
	let email = $state('');
	let delay = $state('1h');
	let loading = $state(false);
	let error = $state('');
	let patternError = $state('');

	function validatePattern(p: string) {
		try {
			new RegExp(p);
			patternError = '';
			return true;
		} catch {
			patternError = 'Invalid regular expression.';
			return false;
		}
	}

	async function handleSubmit() {
		error = '';
		if (!validatePattern(pattern)) return;
		if (!authStore.user) return;

		loading = true;
		try {
			await addDoc(collection(db, `users/${authStore.user.uid}/jobs`), {
				url,
				pattern,
				email,
				delay,
				active: true,
				createdAt: Date.now()
			});
			goto('/dashboard');
		} catch (e) {
			error = 'Failed to create job. Please try again.';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	const DELAYS = [
		{ value: '15m', label: 'Every 15 minutes' },
		{ value: '1h', label: 'Every hour' },
		{ value: '6h', label: 'Every 6 hours' },
		{ value: '24h', label: 'Once a day' }
	];
</script>

<div class="page">
	<div class="page-header">
		<a href="/dashboard" class="back-link">← Back to Dashboard</a>
		<h1 class="page-title">New Scrape Job</h1>
		<p class="page-subtitle">
			Set up a URL monitor — we'll email you whenever the pattern is found.
		</p>
	</div>

	<div class="form-card">
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-sections">
				<!-- Target URL -->
				<section class="form-section">
					<div class="section-label">
						<span class="section-num">01</span>
						<span>Target URL</span>
					</div>
					<div class="field">
						<label for="url" class="field-label">URL to monitor</label>
						<input
							id="url"
							type="url"
							class="field-input"
							placeholder="https://example.com/page"
							bind:value={url}
							required
						/>
						<p class="field-hint">The full URL of the page to scrape.</p>
					</div>
				</section>

				<div class="divider"></div>

				<!-- Search Pattern -->
				<section class="form-section">
					<div class="section-label">
						<span class="section-num">02</span>
						<span>Search Pattern</span>
					</div>
					<div class="field">
						<label for="pattern" class="field-label">Regex pattern</label>
						<div class="input-with-prefix">
							<span class="input-prefix">/</span>
							<input
								id="pattern"
								type="text"
								class="field-input"
								class:error={!!patternError}
								placeholder="in\s?stock|available"
								bind:value={pattern}
								oninput={() => pattern && validatePattern(pattern)}
								required
							/>
							<span class="input-suffix">/</span>
						</div>
						{#if patternError}
							<p class="field-error">{patternError}</p>
						{:else}
							<p class="field-hint">JavaScript-compatible regular expression to search for.</p>
						{/if}
					</div>
				</section>

				<div class="divider"></div>

				<!-- Notification -->
				<section class="form-section">
					<div class="section-label">
						<span class="section-num">03</span>
						<span>Notification</span>
					</div>
					<div class="fields-row">
						<div class="field flex-1">
							<label for="email" class="field-label">Notification email</label>
							<input
								id="email"
								type="email"
								class="field-input"
								placeholder="you@example.com"
								bind:value={email}
								required
							/>
							<p class="field-hint">Where to send match alerts.</p>
						</div>
						<div class="field delay-field">
							<label for="delay" class="field-label">Check frequency</label>
							<div class="select-wrapper">
								<select id="delay" class="field-select" bind:value={delay}>
									{#each DELAYS as opt}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>
								<span class="select-arrow">▾</span>
							</div>
							<p class="field-hint">How often to scrape the URL.</p>
						</div>
					</div>
				</section>
			</div>

			{#if error}
				<div class="error-box" role="alert">⚠ {error}</div>
			{/if}

			<div class="form-footer">
				<a href="/dashboard" class="btn-secondary">Cancel</a>
				<button type="submit" class="btn-primary" disabled={loading}>
					{#if loading}
						<span class="btn-spinner"></span> Creating…
					{:else}
						⚡ Create Job
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.page {
		max-width: 700px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
		text-decoration: none;
		margin-bottom: 1rem;
		transition: color 0.15s;
	}

	.back-link:hover {
		color: var(--text-primary);
		text-decoration: none;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		margin-bottom: 0.3rem;
	}

	.page-subtitle {
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.form-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.form-sections {
		padding: 0;
	}

	.form-section {
		padding: 1.75rem 2rem;
		display: grid;
		grid-template-columns: 160px 1fr;
		gap: 1.5rem;
		align-items: start;
	}

	@media (max-width: 600px) {
		.form-section {
			grid-template-columns: 1fr;
			padding: 1.25rem 1.25rem;
		}
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		padding-top: 0.25rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-num {
		color: var(--accent);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
	}

	.divider {
		height: 1px;
		background: var(--border);
		margin: 0 2rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.field-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.field-input,
	.field-select {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.65rem 1rem;
		color: var(--text-primary);
		transition: border-color 0.15s, box-shadow 0.15s;
		outline: none;
		width: 100%;
	}

	.field-input::placeholder {
		color: var(--text-muted);
	}

	.field-input:focus,
	.field-select:focus {
		border-color: var(--border-focus);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	.field-input.error {
		border-color: var(--danger);
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
	}

	.field-hint {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.field-error {
		font-size: 0.78rem;
		color: #fca5a5;
	}

	.input-with-prefix {
		display: flex;
		align-items: center;
		gap: 0;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow: hidden;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.input-with-prefix:focus-within {
		border-color: var(--border-focus);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	.input-with-prefix .field-input {
		border: none;
		background: transparent;
		border-radius: 0;
		padding: 0.65rem 0.5rem;
		box-shadow: none !important;
	}

	.input-prefix,
	.input-suffix {
		padding: 0 0.75rem;
		color: var(--accent);
		font-family: 'JetBrains Mono', monospace;
		font-size: 1.1rem;
		font-weight: 700;
		user-select: none;
		flex-shrink: 0;
	}

	.fields-row {
		display: flex;
		gap: 1rem;
		align-items: start;
	}

	.flex-1 {
		flex: 1;
	}

	.delay-field {
		width: 180px;
		flex-shrink: 0;
	}

	@media (max-width: 600px) {
		.fields-row {
			flex-direction: column;
		}
		.delay-field {
			width: 100%;
		}
	}

	.select-wrapper {
		position: relative;
	}

	.field-select {
		appearance: none;
		padding-right: 2.5rem;
		cursor: pointer;
	}

	.select-arrow {
		position: absolute;
		right: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.error-box {
		margin: 0 2rem 1.5rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-sm);
		padding: 0.65rem 1rem;
		color: #fca5a5;
		font-size: 0.875rem;
	}

	.form-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem 2rem;
		border-top: 1px solid var(--border);
		background: var(--bg-secondary);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		padding: 0.65rem 1.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 20px var(--accent-glow);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		padding: 0.65rem 1.25rem;
		font-size: 0.9rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.15s;
	}

	.btn-secondary:hover {
		border-color: #3a3a55;
		color: var(--text-primary);
		text-decoration: none;
	}

	.btn-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
		display: inline-block;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
