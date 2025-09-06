/**
 * Pluralizes a word based on the count
 * @param word - The singular form of the word
 * @param count - The number to determine pluralization
 * @param pluralForm - Optional custom plural form (defaults to English pluralization rules)
 */
export const pluralize = (
	word: string,
	count: number,
	pluralForm?: string,
): string => {
	if (count === 1) {
		return `${count} ${word}`;
	}

	if (pluralForm) {
		return `${count} ${pluralForm}`;
	}

	// Simple English pluralization rules
	let plural: string;
	if (
		word.endsWith("ch") ||
		word.endsWith("sh") ||
		word.endsWith("s") ||
		word.endsWith("x") ||
		word.endsWith("z")
	) {
		plural = `${word}es`;
	} else if (
		word.endsWith("y") &&
		word.length > 1 &&
		!"aeiou".includes(word.charAt(word.length - 2))
	) {
		plural = `${word.slice(0, -1)}ies`;
	} else {
		plural = `${word}s`;
	}

	return `${count} ${plural}`;
};
