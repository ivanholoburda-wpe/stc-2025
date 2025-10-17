import { formatMarkdown } from '../../utils/formatMarkdown';

export const MarkdownRenderer = ({ text }) => {
    const formattedHtml = formatMarkdown(text);
    return <div dangerouslySetInnerHTML={{ __html: formattedHtml }} />;
};