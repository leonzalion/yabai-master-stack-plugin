import execa from 'execa';

type ScreenSize = {
	width: number;
	height: number;
}
let cachedScreenSize: ScreenSize | undefined;

export function getScreenSize() {
	if (cachedScreenSize !== undefined) return cachedScreenSize;

	const output = execa.commandSync("system_profiler SPDisplaysDataType | grep Resolution", { shell: true }).stdout;
  const matchGroups = output.match(/(\d+) x (\d+)/)!;
	const width = Number(matchGroups[1]);
	// Subtract bar and dock height
	const height = Number(matchGroups[2]) - 23;

	return (cachedScreenSize = { width, height });
}