<script lang="ts">
	import {
		signInWithEmailAndPassword,
		createUserWithEmailAndPassword,
		type AuthError
	} from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/auth.svelte';
	import { onMount } from 'svelte';

	let mode = $state<'signin' | 'register'>('signin');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	onMount(() => {
		if (authStore.user) goto('/dashboard');
	});

	function friendlyError(code: string): string {
		const map: Record<string, string> = {
			'auth/invalid-credential': 'Invalid email or password.',
			'auth/user-not-found': 'No account found with that email.',
			'auth/wrong-password': 'Incorrect password.',
			'auth/email-already-in-use': 'An account with this email already exists.',
			'auth/weak-password': 'Password must be at least 6 characters.',
			'auth/invalid-email': 'Please enter a valid email address.',
			'auth/too-many-requests': 'Too many attempts. Please try again later.'
		};
		return map[code] ?? 'Something went wrong. Please try again.';
	}

	async function handleSubmit() {
		error = '';
		loading = true;
		try {
			if (mode === 'signin') {
				await signInWithEmailAndPassword(auth, email, password);
			} else {
				await createUserWithEmailAndPassword(auth, email, password);
			}
			goto('/dashboard');
		} catch (e) {
			const err = e as AuthError;
			error = friendlyError(err.code);
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-wrapper">
	<div class="auth-bg">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
	</div>

	<div class="auth-card">
		<div class="auth-header">
			<div class="auth-logo">⚡</div>
			<h1 class="auth-title">ScrapePulse</h1>
			<p class="auth-subtitle">
				{mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
			</p>
		</div>

		<form class="auth-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="field">
				<label for="email" class="field-label">Email address</label>
				<input
					id="email"
					type="email"
					class="field-input"
					placeholder="you@example.com"
					bind:value={email}
					required
					autocomplete="email"
				/>
			</div>

			<div class="field">
				<label for="password" class="field-label">Password</label>
				<input
					id="password"
					type="password"
					class="field-input"
					placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
					bind:value={password}
					required
					autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
				/>
			</div>

			{#if error}
				<div class="error-box" role="alert">
					<span class="error-icon">⚠</span> {error}
				</div>
			{/if}

			<button type="submit" class="btn-primary" disabled={loading}>
				{#if loading}
					<span class="btn-spinner"></span>
				{:else}
					{mode === 'signin' ? 'Sign in' : 'Create account'}
				{/if}
			</button>
		</form>

		<p class="auth-toggle">
			{mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
			<button
				class="toggle-link"
				onclick={() => {
					mode = mode === 'signin' ? 'register' : 'signin';
					error = '';
				}}
			>
				{mode === 'signin' ? 'Create one' : 'Sign in'}
			</button>
		</p>
	</div>
</div>

<style>
	.auth-wrapper {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		background: var(--bg-primary);
		padding: 2rem;
	}

	.auth-bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.18;
	}

	.orb-1 {
		width: 500px;
		height: 500px;
		background: radial-gradient(circle, #6366f1, transparent);
		top: -150px;
		left: -150px;
	}

	.orb-2 {
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, #8b5cf6, transparent);
		bottom: -120px;
		right: -120px;
	}

	.auth-card {
		position: relative;
		width: 100%;
		max-width: 420px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 2.5rem;
		box-shadow: var(--shadow), 0 0 60px rgba(99, 102, 241, 0.08);
	}

	.auth-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.auth-logo {
		font-size: 2.5rem;
		margin-bottom: 0.75rem;
	}

	.auth-title {
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		margin-bottom: 0.35rem;
	}

	.auth-subtitle {
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
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

	.field-input {
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

	.field-input:focus {
		border-color: var(--border-focus);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	.error-box {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-sm);
		padding: 0.65rem 1rem;
		color: #fca5a5;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.error-icon {
		flex-shrink: 0;
	}

	.btn-primary {
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		padding: 0.75rem 1rem;
		font-size: 0.95rem;
		font-weight: 600;
		transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
		box-shadow: 0 4px 20px var(--accent-glow);
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.auth-toggle {
		text-align: center;
		margin-top: 1.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.toggle-link {
		background: none;
		border: none;
		color: var(--accent);
		font-size: inherit;
		font-weight: 500;
		margin-left: 0.25rem;
		padding: 0;
		transition: color 0.15s;
	}

	.toggle-link:hover {
		color: var(--accent-hover);
	}
</style>
