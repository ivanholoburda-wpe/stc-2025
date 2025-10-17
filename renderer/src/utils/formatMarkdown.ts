export const formatMarkdown = (text) => {
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    const lines = html.split('\n');
    let newHtml = '';
    let currentListHtml = '';
    let inList = false;

    lines.forEach(line => {
        const trimmedLine = line.trimStart();

        if (trimmedLine.startsWith('*')) {
            if (!inList) {
                if (newHtml.endsWith('</p>')) {
                    newHtml = newHtml.substring(0, newHtml.length - 4);
                }
                currentListHtml += '<ul class="list-disc pl-5 my-1 text-sm">';
                inList = true;
            }

            const leadingSpaces = line.length - trimmedLine.length;
            const indentLevel = Math.floor(leadingSpaces / 4);
            const margin = indentLevel * 16;

            const content = trimmedLine.substring(1).trimStart();
            currentListHtml += `<li style="margin-left: ${margin}px;">${content}</li>`;
        } else {
            if (inList) {
                currentListHtml += '</ul>';
                newHtml += currentListHtml;
                currentListHtml = '';
                inList = false;
            }
            if (line.trim().length > 0) {
                newHtml += `<p class="mt-2 text-sm">${line}</p>`;
            }
        }
    });

    if (inList) {
        currentListHtml += '</ul>';
        newHtml += currentListHtml;
    }

    if (newHtml === '') {
        return `<p class="text-sm">${html}</p>`;
    }

    return newHtml;
};