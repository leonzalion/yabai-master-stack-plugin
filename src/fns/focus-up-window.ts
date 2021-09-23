import { yabaiPath } from '../config';
import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMasterError } from '../utils/error';

async function master() {
	const state = await readState();
	const wm = createWindowsManager({
		display: getFocusedDisplay(),
		expectedCurrentNumMasterWindows: state.numMasterWindows,
	});
	const focusedWindow = wm.getFocusedWindow();
	if (focusedWindow !== undefined) {
		// If the focused window is the highest window
		if (
			wm.isMasterWindow(focusedWindow) &&
			wm.isTopWindow(wm.getMasterWindows(), focusedWindow)
		) {
			// Focus on the bottom stack window
			const bottomStackWindow = wm.getBottomStackWindow();
			if (bottomStackWindow !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${bottomStackWindow.id}`
				);
			}
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isTopWindow(wm.getStackWindows(), focusedWindow)
		) {
			// Focus on the bottom master window
			const bottomMasterWindow = wm.getBottomMasterWindow();
			if (bottomMasterWindow !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${bottomMasterWindow.id}`
				);
			}
		} else {
			// Otherwise, just focus north
			wm.executeYabaiCommand(`${yabaiPath} -m window --focus north`);
		}
	}
}

master().catch(handleMasterError);
