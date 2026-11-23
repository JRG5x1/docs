// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://docs.5x1.com',
	integrations: [
		starlight({
			title: '5x1 Developers',
			logo: { src: './src/logo.svg' },
			favicon: '/logo.svg',
			customCss: ['./src/styles/5x1.css'],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/JRG5x1' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/CBVJzkRGwN' },
			],
			editLink: { baseUrl: 'https://github.com/JRG5x1/docs/edit/main/' },
			sidebar: [
				{
					label: 'Start here',
					items: [
						{ label: 'Welcome', slug: 'index' },
						{ label: 'How 5x1 fits together', slug: 'start/overview' },
						{ label: 'Set up for development', slug: 'start/setup' },
					],
				},
				{
					label: 'Skills',
					items: [
						{ label: 'Your first skill', slug: 'skills/first-skill' },
						{ label: 'Anatomy of a skill', slug: 'skills/anatomy' },
						{ label: 'Launch phrases', slug: 'skills/phrases' },
						{ label: 'Settings', slug: 'skills/settings' },
						{ label: 'Background scripts', slug: 'skills/background' },
						{
							label: 'Skill API',
							items: [
								{ label: 'Lifecycle', slug: 'skills/api/lifecycle' },
								{ label: 'Screen and touch', slug: 'skills/api/screen' },
								{ label: 'Speech and animation', slug: 'skills/api/speech-and-animation' },
								{ label: 'Listening', slug: 'skills/api/listening' },
								{ label: 'Camera, storage and network', slug: 'skills/api/media-and-data' },
								{ label: 'Permissions', slug: 'skills/api/permissions' },
							],
						},
					],
				},
				{
					label: 'Themes',
					items: [
						{ label: 'Your first theme', slug: 'themes/first-theme' },
						{ label: 'Theme reference', slug: 'themes/reference' },
					],
				},
				{
					label: 'Install, test and publish',
					items: [
						{ label: 'Install and test', slug: 'testing/install-and-test' },
						{ label: 'Debugging', slug: 'testing/debugging' },
						{ label: 'Publish to the 5x1 Store', slug: 'themes/publishing' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'manifest.json', slug: 'reference/manifest' },
						{ label: 'BEacon HTTP API', slug: 'reference/beacon-api' },
					],
				},
			],
		}),
	],
});
