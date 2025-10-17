export const formatMarkdown = (text) => {
    // 1. Convert **text** to <strong>text</strong> (Bold)
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 2. Convert *text* to <em>text</em> (Italics/Emphasis)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 3. Simple list item processing (handles * and indentation for lists)
    const lines = html.split('\n');
    let newHtml = '';
    let currentListHtml = '';
    let inList = false;

    lines.forEach(line => {
        const trimmedLine = line.trimStart();

        if (trimmedLine.startsWith('*')) {
            // Start list if not already in one
            if (!inList) {
                // Close previous paragraph
                if (newHtml.endsWith('</p>')) {
                    newHtml = newHtml.substring(0, newHtml.length - 4);
                }
                currentListHtml += '<ul class="list-disc pl-5 my-1 text-sm">';
                inList = true;
            }

            // Calculate indentation based on leading spaces (1 tab/4 spaces = 1 indent level)
            const leadingSpaces = line.length - trimmedLine.length;
            const indentLevel = Math.floor(leadingSpaces / 4);
            // Use Tailwind spacing units (indent-level * 4 * 4px for rough estimate)
            const margin = indentLevel * 16;

            // Remove the * and wrap the content in <li> with calculated style
            // Note: The * has already been removed in the previous Markdown parsing steps if it was used for italics.
            // We only remove the list marker * here.
            const content = trimmedLine.substring(1).trimStart();
            currentListHtml += `<li style="margin-left: ${margin}px;">${content}</li>`;
        } else {
            // If we were in a list, close it and append to newHtml
            if (inList) {
                currentListHtml += '</ul>';
                newHtml += currentListHtml;
                currentListHtml = '';
                inList = false;
            }
            // Add other lines (paragraphs, headings, etc.)
            // Only add non-empty lines as paragraphs
            if (line.trim().length > 0) {
                // Add <p> only if it hasn't been added yet
                newHtml += `<p class="mt-2 text-sm">${line}</p>`;
            }
        }
    });

    // Close any remaining list
    if (inList) {
        currentListHtml += '</ul>';
        newHtml += currentListHtml;
    }

    // Fallback if no structure was detected
    if (newHtml === '') {
        return `<p class="text-sm">${html}</p>`;
    }

    return newHtml;
};