<script lang="ts">
	import './layout.css';
	import { authStore } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();

	async function handleSignOut() {
		await authStore.signOut();
		goto('/login');
	}

	const isAuthPage = $derived($page.url.pathname === '/login');
	const currentPath = $derived($page.url.pathname);
</script>

<svelte:head>
	<title>ScrapePulse</title>
	<meta name="description" content="Monitor the web with smart scraping jobs" />
</svelte:head>

{#if !isAuthPage && authStore.user}
	<header class="navbar">
		<div class="navbar-inner">
			<a href="/dashboard" class="logo">
				<span class="logo-icon">⚡</span>
				<span class="logo-text">ScrapePulse</span>
			</a>
			<nav class="nav-links">
				<a href="/dashboard" class="nav-link" class:active={currentPath === '/dashboard'}>Dashboard</a>
				<a href="/analytics" class="nav-link" class:active={currentPath.startsWith('/analytics')}>Analytics</a>
				<a href="/jobs/new" class="nav-link nav-link--cta">+ New Job</a>
			</nav>
			<div class="navbar-right">
				<span class="user-email">{authStore.user.email}</span>
				<button class="btn-signout" onclick={handleSignOut}>Sign out</button>
			</div>
		</div>
	</header>
{/if}

<main class="main-content" class:fullscreen={isAuthPage || !authStore.user}>
	{@render children()}
</main>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 100;
		background: rgba(18, 18, 26, 0.85);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border);
	}

	.navbar-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
		height: 64px;
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		flex-shrink: 0;
	}

	.logo-icon {
		font-size: 1.4rem;
	}

	.logo-text {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.nav-link {
		padding: 0.4rem 0.8rem;
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		transition: color 0.15s, background 0.15s;
		text-decoration: none;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--text-primary);
		background: var(--bg-card);
		text-decoration: none;
	}

	.nav-link.active {
		color: var(--text-primary);
	}

	.nav-link--cta {
		background: var(--accent);
		color: #fff;
		padding: 0.4rem 1rem;
	}

	.nav-link--cta:hover {
		background: var(--accent-hover);
		color: #fff;
	}

	.navbar-right {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-left: auto;
		flex-shrink: 0;
	}

	.user-email {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.btn-signout {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 0.35rem 0.85rem;
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		transition: all 0.15s;
	}

	.btn-signout:hover {
		border-color: var(--danger);
		color: var(--danger);
		background: rgba(239, 68, 68, 0.08);
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem;
	}

	.main-content.fullscreen {
		max-width: 100%;
		padding: 0;
	}
</style>
