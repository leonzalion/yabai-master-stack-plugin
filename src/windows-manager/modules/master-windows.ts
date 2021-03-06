import type { Window } from '~/types/yabai.js';
import { getConfig } from '~/utils/config.js';
import { logDebug } from '~/utils/log.js';
import { useDefineMethods } from '~/utils/modules.js';
import { isYabai3Window } from '~/utils/yabai.js';

export function masterWindowModule() {
	const defineMethods = useDefineMethods();

	return defineMethods({
		/**
			If the master position is on the right, a window which is to the right of the dividing line is considered a master window.
			If the master position is on the left, a window that is touching the left edge is considered a master window.
		*/
		isMasterWindow(window: Window) {
			if (getConfig().masterPosition === 'left') {
				return this.isWindowTouchingLeftEdge(window);
			} else {
				const dividingLineXCoordinate = this.getDividingLineXCoordinate();
				return window.frame.x >= dividingLineXCoordinate;
			}
		},
		getMasterWindows() {
			if (getConfig().masterPosition === 'right') {
				const dividingLineXCoordinate = this.getDividingLineXCoordinate();
				return this.windowsData.filter(
					(window) => window.frame.x >= dividingLineXCoordinate
				);
			} else {
				return this.windowsData.filter((window) =>
					this.isWindowTouchingLeftEdge(window)
				);
			}
		},
		getTopMasterWindow() {
			return this.getTopWindow(this.getMasterWindows());
		},
		getBottomMasterWindow() {
			return this.getBottomWindow(this.getMasterWindows());
		},
		getWidestMasterWindow() {
			let widestMasterWindow: Window | undefined;
			for (const window of this.getMasterWindows()) {
				if (
					widestMasterWindow === undefined ||
					window.frame.w > widestMasterWindow.frame.w
				) {
					widestMasterWindow = window;
				}
			}

			return widestMasterWindow;
		},

		async moveWindowToMaster(window: Window) {
			logDebug(() => `Moving window ${window.app} to master.`);

			// Use a small heuristic that helps prevent "glitchy" window rearrangements
			// Only execute this heuristic when the layout isn't a pancake
			if (this.expectedCurrentNumMasterWindows < this.windowsData.length) {
				try {
					if (getConfig().masterPosition === 'right') {
						await this.executeYabaiCommand(
							`-m window ${window.id} --warp east`
						);
					} else {
						await this.executeYabaiCommand(
							`-m window ${window.id} --warp west`
						);
					}
				} catch {
					// noop
				}
			}

			// If the window is already a master window, then don't do anything
			if (this.isMasterWindow(window)) {
				return;
			}

			// Find a window that's touching the right side of the screen
			const masterWindow = this.getWidestMasterWindow();

			if (masterWindow === undefined || masterWindow.id === window.id) {
				return;
			}

			await this.executeYabaiCommand(
				`-m window ${window.id} --warp ${masterWindow.id}`
			);
			window = this.getUpdatedWindowData(window);

			const splitType = isYabai3Window(window)
				? window.split
				: window['split-type'];

			if (splitType === 'vertical') {
				await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
			}
		},
		/**
			Turns the master into a column by making sure the split direction of all the master windows
			is horizontal.
		 */
		async columnizeMasterWindows() {
			const masterWindows = this.getMasterWindows();
			if (masterWindows.length > 1) {
				for (const masterWindow of masterWindows) {
					const window = this.getUpdatedWindowData(masterWindow);

					const splitType = isYabai3Window(window)
						? window.split
						: window['split-type'];

					if (splitType === 'vertical') {
						// eslint-disable-next-line no-await-in-loop
						await this.executeYabaiCommand(
							`-m window ${window.id} --toggle split`
						);
					}
				}
			}
		},
	});
}
