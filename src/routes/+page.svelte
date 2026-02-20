<script lang="ts">
	import { authStore } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		const interval = setInterval(() => {
			if (!authStore.loading) {
				clearInterval(interval);
				goto(authStore.user ? '/dashboard' : '/login');
			}
		}, 50);
	});
</script>

<div class="splash">
	<div class="spinner"></div>
</div>

<style>
	.splash {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
	}

	.spinner {
		width: 40px;
		height: 40px;
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
</style>
