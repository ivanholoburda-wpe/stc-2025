import React, {useState, useEffect, useRef} from 'react';
import {SendIcon} from "../../icons";
import {analyzeSnapshot, getSnapshots} from "../../api/snapshot"
import {APIResult} from "../../api/types";
import {MarkdownRenderer} from "../ui/MarkdownRenderer";

const generateId = () => crypto.randomUUID();

export const AiView = () => {
    const [selectedSnapshot, setSelectedSnapshot] = useState('');
    const [inputValue, setInputValue] = useState('');

    const [messages, setMessages] = useState([
        {id: generateId(), sender: 'ai', text: 'Вітаю! Оберіть снапшот і поставте ваше запитання.'}
    ]);

    const [snapshots, setSnapshots] = useState([]);
    const [isSnapshotsLoading, setIsSnapshotsLoading] = useState(true);

    useEffect(() => {
        const fetchSnapshots = async () => {
            try {
                const result = await getSnapshots();
                console.log(result);
                if (result.success) {
                    setSnapshots(result.data);
                } else {
                    setMessages(prev => [...prev, {
                        id: crypto.randomUUID(),
                        sender: 'ai',
                        text: `Помилка завантаження снапшотів: ${result.error}`
                    }]);
                }
            } catch (error) {
                console.error("Error fetching snapshots:", error);
                setMessages(prev => [...prev, {
                    id: crypto.randomUUID(),
                    sender: 'ai',
                    text: `Критична помилка: ${(error as Error).message}`
                }]);
            } finally {
                setIsSnapshotsLoading(false);
            }
        };

        fetchSnapshots();
    }, []);

    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        if (!selectedSnapshot) {
            setMessages(prev => [...prev, {
                id: generateId(),
                sender: 'ai',
                text: 'Будь ласка, спочатку оберіть снапшот.'
            }]);
            return;
        }

        const newUserMessage = {id: generateId(), sender: 'user', text: inputValue};
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsLoading(true);

        analyzeSnapshot(+selectedSnapshot, newUserMessage.text)
            .then((response: APIResult<string>) => {
                setMessages(prev => [...prev, {
                    id: generateId(),
                    sender: 'ai',
                    text: response.data
                }]);
                setIsLoading(false);
            })
            .catch((error: Error) => {
                setMessages(prev => [...prev, {
                    id: generateId(),
                    sender: 'ai',
                    text: 'An error occurred while sending your prompt to AI model.',
                }]);
                setIsLoading(false);
            })
    };

    return (
        <div className="flex flex-col h-full p-6 text-white bg-gray-900">
            <div className="mb-4 flex-shrink-0">
                <label htmlFor="snapshot-select" className="block text-sm font-medium text-gray-300 mb-2">Оберіть
                    снапшот для аналізу:</label>
                <select
                    id="snapshot-select"
                    value={selectedSnapshot}
                    onChange={(e) => setSelectedSnapshot(e.target.value)}
                    disabled={isSnapshotsLoading}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out shadow-inner"
                >
                    <option value="" disabled>
                        {isSnapshotsLoading ? 'Завантаження снапшотів...' : '-- Будь ласка, виберіть --'}
                    </option>
                    {snapshots.map(snap => (
                        <option key={snap.id} value={snap.id}>
                            Snapshot #{snap.id} - {new Date(snap.created_at).toLocaleString()}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex-grow bg-gray-800 rounded-xl shadow-2xl p-4 flex flex-col overflow-hidden">
                <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xl rounded-xl px-4 py-2 shadow-md transition-all duration-300 ${msg.sender === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-700 text-gray-100 rounded-tl-none'
                                }`}>
                                {msg.sender === 'ai' ? (
                                    <MarkdownRenderer text={msg.text} />
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-700 rounded-xl shadow-md">
                                <div className="flex justify-center items-center p-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef}/>
                </div>

                <form onSubmit={handleSendMessage} className="mt-4 flex-shrink-0 flex items-center gap-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isLoading ? "AI генерує відповідь..." : "Введіть ваше запитання..."}
                        disabled={isLoading}
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-full py-2.5 px-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition duration-150 ease-in-out"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-blue-600 rounded-full p-3 text-white shadow-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                        title="Надіслати"
                    >
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </form>
            </div>
        </div>
    );
};