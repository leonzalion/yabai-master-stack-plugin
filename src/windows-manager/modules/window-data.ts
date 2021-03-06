import { execa } from 'execa';

import type { Window } from '~/types/yabai.js';
import { getConfig } from '~/utils/config.js';
import { useDefineMethods } from '~/utils/modules.js';
import { getYabaiOutput, isYabai3Window } from '~/utils/yabai.js';

export function windowDataModule() {
	const defineMethods = useDefineMethods();
	return defineMethods({
		async initialize() {
			this.windowsData = await this.getWindowsData();
		},
		async refreshWindowsData() {
			const newWindowsData = await this.getWindowsData();
			this.windowsData = newWindowsData;
		},
		getUpdatedWindowData(window: Window) {
			return this.windowsData.find((win) => window.id === win.id)!;
		},
		getWindowData({
			processId,
			windowId,
		}: {
			processId: string;
			windowId: string;
		}): Window {
			if (processId === undefined && windowId === undefined) {
				throw new Error('Must provide at least one of processId or windowId');
			}

			const windowData = this.windowsData.find(
				(window) =>
					window.pid === Number(processId) || window.id === Number(windowId)
			);

			if (windowData === undefined) {
				if (processId === undefined) {
					throw new Error(`Window with id ${windowId} not found.`);
				} else {
					throw new Error(`Window with pid ${processId} not found.`);
				}
			}

			return windowData;
		},
		async getWindowsData() {
			const { yabaiPath } = getConfig();
			const yabaiProcess = execa(yabaiPath, ['-m', 'query', '--windows']);
			const yabaiOutputPromise = getYabaiOutput(yabaiProcess);
			const yabaiOutput = await yabaiOutputPromise;
			const windowsData = (JSON.parse(yabaiOutput) as Window[]).filter(
				(window) => {
					const isFloating = isYabai3Window(window)
						? window.floating
						: window['is-floating'];

					// Window should not be floating
					if (
						isFloating ||
						window.display !== this.display.index ||
						window.space !== this.space.index
					) {
						return false;
					}

					const isMinimized = isYabai3Window(window)
						? window.minimized
						: window['is-minimized'];

					if (isMinimized) return false;

					return true;
				}
			);
			return windowsData;
		},
		getFocusedWindow(): Window | undefined {
			return this.windowsData.find((w) =>
				isYabai3Window(w) ? w.focused : w['has-focus']
			);
		},
	});
}
