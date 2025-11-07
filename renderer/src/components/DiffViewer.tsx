import React, { useMemo, useState, useRef, useEffect } from 'react';
import { compareObjects, hasDifferenceAtPath } from '../utils/objectDiff';

interface DiffViewerProps {
    left: any;
    right: any;
    showDiff: boolean;
    highlightDiff: boolean;
    onToggleHighlight: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
    left,
    right,
    showDiff,
    highlightDiff,
    onToggleHighlight,
}) => {
    const [currentDiffIndex, setCurrentDiffIndex] = useState<number | null>(null);
    const leftScrollContainerRef = useRef<HTMLDivElement>(null);
    const rightScrollContainerRef = useRef<HTMLDivElement>(null);
    const diffElementRefs = useRef<Map<string, HTMLElement>>(new Map());
    const leftElementRefs = useRef<Map<string, HTMLElement>>(new Map());

    const differences = useMemo(() => {
        if (!left || !right) return [];
        return compareObjects(left, right);
    }, [left, right]);

    const visibleDifferences = useMemo(() => {
        return differences.filter(d => {
            return d.path.length === 0 || d.path[d.path.length - 1] !== 'id';
        });
    }, [differences]);

    useEffect(() => {
        setCurrentDiffIndex(prev => {
            if (visibleDifferences.length > 0) {
                if (prev === null || prev >= visibleDifferences.length) {
                    return 0;
                }
                return prev;
            } else {
                return null;
            }
        });
    }, [visibleDifferences.length]);

    useEffect(() => {
        if (currentDiffIndex !== null && highlightDiff && visibleDifferences[currentDiffIndex]) {
            const diff = visibleDifferences[currentDiffIndex];
            const pathKey = diff.path.join('.');
            const rightElement = diffElementRefs.current.get(pathKey);
            const leftElement = leftElementRefs.current.get(pathKey);
            
            const scrollToElement = (element: HTMLElement, container: HTMLDivElement | null) => {
                if (!container || !element) return;
                
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                
                const scrollTop = container.scrollTop;
                const elementTop = elementRect.top - containerRect.top + scrollTop;
                const containerHeight = container.clientHeight;
                const elementHeight = elementRect.height;
                
                const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
                
                container.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
            };
            
            if (rightElement && rightScrollContainerRef.current) {
                scrollToElement(rightElement, rightScrollContainerRef.current);
            }
            
            if (leftElement && leftScrollContainerRef.current) {
                scrollToElement(leftElement, leftScrollContainerRef.current);
            }
        }
    }, [currentDiffIndex, highlightDiff, visibleDifferences]);

    const goToNextDiff = () => {
        if (visibleDifferences.length === 0) return;
        setCurrentDiffIndex(prev => {
            if (prev === null) return 0;
            return (prev + 1) % visibleDifferences.length;
        });
    };

    const goToPrevDiff = () => {
        if (visibleDifferences.length === 0) return;
        setCurrentDiffIndex(prev => {
            if (prev === null) return visibleDifferences.length - 1;
            return prev === 0 ? visibleDifferences.length - 1 : prev - 1;
        });
    };

    const renderValue = (value: any, path: string[], isLeft: boolean): React.ReactNode => {
        if (value === null || value === undefined) {
            return <span className="text-gray-500">null</span>;
        }

        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return (
                    <div className="ml-4">
                        {value.map((item, index) => {
                            const itemPath = [...path, index.toString()];
                            const diff = highlightDiff && !isLeft ? hasDifferenceAtPath(differences, itemPath) : null;
                            const pathKey = itemPath.join('.');
                            const isCurrentDiff = currentDiffIndex !== null && 
                                visibleDifferences[currentDiffIndex]?.path.join('.') === pathKey;

                            const bgColor = diff && highlightDiff && !isLeft
                                ? isCurrentDiff
                                    ? diff.type === 'added'
                                        ? 'bg-green-700/60 border-green-400 border-4'
                                        : 'bg-red-700/60 border-red-400 border-4'
                                    : diff.type === 'added'
                                        ? 'bg-green-900/40 border-green-500/70'
                                        : diff.type === 'deleted'
                                          ? 'bg-red-900/40 border-red-500/70'
                                          : 'bg-red-900/40 border-red-500/70'
                                : '';

                            return (
                                <div
                                    key={index}
                                    ref={el => {
                                        if (el) {
                                            if (isLeft) {
                                                leftElementRefs.current.set(pathKey, el);
                                            } else if (diff) {
                                                diffElementRefs.current.set(pathKey, el);
                                            }
                                        }
                                    }}
                                    className={`mb-2 p-2 rounded border transition-all ${bgColor} ${diff && highlightDiff && !isLeft ? 'border-2' : 'border-gray-600'}`}
                                >
                                    <span className="text-gray-400 text-xs">[{index}]</span>
                                    {renderValue(item, itemPath, isLeft)}
                                </div>
                            );
                        })}
                    </div>
                );
            } else {
                const allKeys = new Set(Object.keys(value));
                if (!isLeft && highlightDiff) {
                    differences
                        .filter(d => d.type === 'added' && d.path.length === path.length + 1)
                        .forEach(d => {
                            const key = d.path[d.path.length - 1];
                            if (key !== 'id') {
                                allKeys.add(key);
                            }
                        });
                }
                
                return (
                    <div className="ml-4 space-y-1">
                        {Array.from(allKeys).map(key => {
                            const keyPath = [...path, key];
                            const itemValue = value[key];
                            const diff = (highlightDiff && !isLeft && key !== 'id') ? hasDifferenceAtPath(differences, keyPath) : null;
                            const pathKey = keyPath.join('.');
                            const isCurrentDiff = currentDiffIndex !== null && 
                                visibleDifferences[currentDiffIndex]?.path.join('.') === pathKey;
                            
                            const bgColor = diff && highlightDiff && !isLeft && key !== 'id'
                                ? isCurrentDiff
                                    ? diff.type === 'added'
                                        ? 'bg-green-700/60 border-2 border-green-400'
                                        : 'bg-red-700/60 border-2 border-red-400'
                                    : diff.type === 'added'
                                        ? 'bg-green-900/40'
                                        : diff.type === 'deleted'
                                          ? 'bg-red-900/40'
                                          : 'bg-red-900/40'
                                : '';

                            return (
                                <div 
                                    key={key} 
                                    ref={el => {
                                        if (el) {
                                            if (isLeft) {
                                                leftElementRefs.current.set(pathKey, el);
                                            } else if (diff && key !== 'id') {
                                                diffElementRefs.current.set(pathKey, el);
                                            }
                                        }
                                    }}
                                    className={`p-1 rounded transition-all ${bgColor}`}
                                >
                                    <span className="text-blue-400 font-mono text-sm">{key}:</span>{' '}
                                    {itemValue !== undefined ? renderValue(itemValue, keyPath, isLeft) : <span className="text-gray-500 italic">(missing)</span>}
                                </div>
                            );
                        })}
                    </div>
                );
            }
        }

        const isIdField = path.length > 0 && path[path.length - 1] === 'id';
        const diff = (highlightDiff && !isLeft && !isIdField) ? hasDifferenceAtPath(differences, path) : null;
        const pathKey = path.join('.');
        const isCurrentDiff = currentDiffIndex !== null && 
            visibleDifferences[currentDiffIndex]?.path.join('.') === pathKey;
        
        let textColor = 'text-gray-200';
        if (diff && highlightDiff && !isLeft && !isIdField) {
            if (isCurrentDiff) {
                textColor = diff.type === 'added' ? 'text-green-300 font-bold' : 'text-red-300 font-bold';
            } else {
                if (diff.type === 'added') {
                    textColor = 'text-green-400 font-semibold';
                } else if (diff.type === 'deleted') {
                    textColor = 'text-red-400';
                } else {
                    textColor = 'text-red-400 font-semibold';
                }
            }
        }

        return (
            <span 
                ref={el => {
                    if (el) {
                        if (isLeft) {
                            leftElementRefs.current.set(pathKey, el);
                        } else if (diff && !isIdField) {
                            diffElementRefs.current.set(pathKey, el);
                        }
                    }
                }}
                className={textColor}
            >
                {String(value)}
            </span>
        );
    };

    const renderObject = (obj: any, isLeft: boolean) => {
        if (!obj) {
            return <div className="text-gray-500">No data</div>;
        }

        return (
            <div className="font-mono text-sm">
                {renderValue(obj, [], isLeft)}
            </div>
        );
    };

    if (!showDiff) {
        return null;
    }

    return (
        <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Differences</h3>
                <div className="flex gap-2">
                    <button
                        onClick={onToggleHighlight}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            highlightDiff
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                    >
                        {highlightDiff ? 'Hide Highlight' : 'Show Highlight'}
                    </button>
                </div>
            </div>

            {differences.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
                    No differences found. Objects are identical.
                </div>
            ) : (
                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-400">
                            Found {visibleDifferences.length} difference{visibleDifferences.length !== 1 ? 's' : ''}
                            {currentDiffIndex !== null && (
                                <span className="ml-2 text-blue-400">
                                    ({currentDiffIndex + 1} of {visibleDifferences.length})
                                </span>
                            )}
                        </div>
                        {highlightDiff && visibleDifferences.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToPrevDiff}
                                    disabled={visibleDifferences.length === 0}
                                    className="px-3 py-1.5 rounded text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    title="Previous difference"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Prev
                                </button>
                                <button
                                    onClick={goToNextDiff}
                                    disabled={visibleDifferences.length === 0}
                                    className="px-3 py-1.5 rounded text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    title="Next difference"
                                >
                                    Next
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Device A (Left)</div>
                            <div ref={leftScrollContainerRef} className="bg-gray-900 rounded p-3 max-h-96 overflow-auto">
                                {renderObject(left, true)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Device B (Right)</div>
                            <div ref={rightScrollContainerRef} className="bg-gray-900 rounded p-3 max-h-96 overflow-auto">
                                {renderObject(right, false)}
                            </div>
                        </div>
                    </div>
                    {highlightDiff && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <div className="text-xs text-gray-400 mb-2">Legend (highlighting differences in Device B):</div>
                            <div className="flex gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-900/40 border-2 border-green-500/70 rounded"></div>
                                    <span className="text-green-400">Added (new in Device B)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-900/40 border-2 border-red-500/70 rounded"></div>
                                    <span className="text-red-400">Modified/Deleted (different in Device B)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

