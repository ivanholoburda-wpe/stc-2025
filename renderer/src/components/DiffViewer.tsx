import React, { useMemo, useState, useRef, useEffect } from 'react';
import { compareObjects, hasDifferenceAtPath, getValueByPath } from '../utils/objectDiff';

interface DiffViewerProps {
    left: any;
    right: any;
    showDiff: boolean;
    highlightDiff: boolean;
    onToggleHighlight: () => void;
    removedRightLabel?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
                                                          left,
                                                          right,
                                                          showDiff,
                                                          highlightDiff,
                                                          onToggleHighlight,
                                                          removedRightLabel,
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

    const deletedKeysByParent = useMemo(() => {
        const map = new Map<string, Set<string>>();
        for (const d of differences) {
            if (d.type !== 'deleted') continue;
            if (d.path.length === 0) continue;
            const parent = d.path.slice(0, -1).join('.');
            const key = d.path[d.path.length - 1];
            if (!isNaN(Number(key))) continue;
            if (!map.has(parent)) map.set(parent, new Set());
            map.get(parent)!.add(key);
        }
        return map;
    }, [differences]);

    const deletedIndicesByArrayPath = useMemo(() => {
        const map = new Map<string, Set<number>>();
        for (const d of differences) {
            if (d.type !== 'deleted') continue;
            if (d.path.length === 0) continue;
            const last = d.path[d.path.length - 1];
            const idx = Number(last);
            if (Number.isInteger(idx)) {
                const arrPath = d.path.slice(0, -1).join('.');
                if (!map.has(arrPath)) map.set(arrPath, new Set());
                map.get(arrPath)!.add(idx);
            }
        }
        return map;
    }, [differences]);

    useEffect(() => {
        diffElementRefs.current = new Map();
        leftElementRefs.current = new Map();
    }, [left, right, highlightDiff]);

    const visibleDifferences = useMemo(() => {
        return differences.filter(d => {
            const last = d.path[d.path.length - 1];
            if (last === 'id') return false;
            if (d.type !== 'deleted') {
                return getValueByPath(right, d.path) !== undefined;
            }
            const parentPath = d.path.slice(0, -1);
            const parentRight = getValueByPath(right, parentPath);
            return parentRight !== undefined;
        });
    }, [differences, right]);

    const pathIndexMap = useMemo(() => {
        const m = new Map<string, number>();
        visibleDifferences.forEach((d, i) => m.set(d.path.join('.'), i));
        return m;
    }, [visibleDifferences]);

    useEffect(() => {
        setCurrentDiffIndex(prev => {
            if (visibleDifferences.length > 0) {
                if (prev === null || prev >= visibleDifferences.length) return 0;
                return prev;
            } else {
                return null;
            }
        });
    }, [visibleDifferences.length]);

    const findNextIndexWithRightRef = (start: number | null, dir: 1 | -1) => {
        if (visibleDifferences.length === 0) return null;
        let i = start === null ? (dir === 1 ? 0 : visibleDifferences.length - 1) : start;
        for (let step = 0; step < visibleDifferences.length; step++) {
            i = (i + dir + visibleDifferences.length) % visibleDifferences.length;
            const key = visibleDifferences[i].path.join('.');
            if (diffElementRefs.current.get(key)) return i;
        }
        return null;
    };

    const goToNextDiff = () => {
        if (visibleDifferences.length === 0) return;
        setCurrentDiffIndex(prev => findNextIndexWithRightRef(prev, 1));
    };

    const goToPrevDiff = () => {
        if (visibleDifferences.length === 0) return;
        setCurrentDiffIndex(prev => findNextIndexWithRightRef(prev, -1));
    };

    const handlePathClick = (pathKey: string) => {
        const i = pathIndexMap.get(pathKey);
        if (i !== undefined) setCurrentDiffIndex(i);
    };

    useEffect(() => {
        if (currentDiffIndex === null || !highlightDiff || !visibleDifferences[currentDiffIndex]) return;
        const diff = visibleDifferences[currentDiffIndex];
        const pathKey = diff.path.join('.');
        const rightElement = diffElementRefs.current.get(pathKey);
        const leftElement = leftElementRefs.current.get(pathKey);
        if (!rightElement) {
            setCurrentDiffIndex(prev => findNextIndexWithRightRef(prev, 1));
            return;
        }
        const scrollToElement = (element: HTMLElement, container: HTMLDivElement | null) => {
            if (!container || !element) return;
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const scrollTop = container.scrollTop;
            const elementTop = elementRect.top - containerRect.top + scrollTop;
            const containerHeight = container.clientHeight;
            const elementHeight = elementRect.height;
            const targetScrollTop = elementTop - containerHeight / 2 + elementHeight / 2;
            container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        };
        if (rightScrollContainerRef.current) scrollToElement(rightElement, rightScrollContainerRef.current);
        if (leftElement && leftScrollContainerRef.current) scrollToElement(leftElement, leftScrollContainerRef.current);
    }, [currentDiffIndex, highlightDiff, visibleDifferences]);

    const renderValue = (value: any, path: string[], isLeft: boolean): React.ReactNode => {
        if (value === null || value === undefined) {
            return <span className="text-gray-500">null</span>;
        }

        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                const baseIndices = value.map((_, i) => i);
                const arrKey = path.join('.');
                const deletedIdx = !isLeft && highlightDiff ? (deletedIndicesByArrayPath.get(arrKey) || new Set()) : new Set<number>();
                const indexSet = new Set<number>([...baseIndices, ...deletedIdx]);
                const indices = Array.from(indexSet).sort((a, b) => a - b);

                return (
                    <div className="ml-4">
                        {indices.map((index) => {
                            const itemPath = [...path, index.toString()];
                            const diffForClick = hasDifferenceAtPath(differences, itemPath);
                            const diffForStyle = highlightDiff && !isLeft ? diffForClick : null;
                            const pathKey = itemPath.join('.');
                            const rightHasValue = !isLeft && index in value;
                            const isDeletedHereRight = !isLeft && diffForClick?.type === 'deleted' && !rightHasValue;
                            const isCurrentDiff = currentDiffIndex !== null &&
                                visibleDifferences[currentDiffIndex]?.path.join('.') === pathKey;

                            const bgColor = diffForStyle && highlightDiff && !isLeft
                                ? isCurrentDiff
                                    ? diffForStyle.type === 'added'
                                        ? 'bg-green-700/60 border-green-400 border-4'
                                        : 'bg-red-700/60 border-red-400 border-4'
                                    : diffForStyle.type === 'added'
                                        ? 'bg-green-900/40 border-green-500/70'
                                        : 'bg-red-900/40 border-red-500/70'
                                : '';

                            const clickable = !!diffForClick && pathIndexMap.has(pathKey);

                            return (
                                <div
                                    key={index}
                                    ref={el => {
                                        if (el) {
                                            if (isLeft) {
                                                leftElementRefs.current.set(pathKey, el);
                                            } else if (!isLeft && diffForClick) {
                                                diffElementRefs.current.set(pathKey, el);
                                            }
                                        }
                                    }}
                                    onClick={clickable ? () => handlePathClick(pathKey) : undefined}
                                    role={clickable ? 'button' : undefined}
                                    className={`mb-2 p-2 rounded border transition-all ${bgColor} ${diffForStyle && highlightDiff && !isLeft ? 'border-2' : 'border-gray-600'} ${clickable ? 'cursor-pointer' : ''}`}
                                >
                                    <span className="text-gray-400 text-xs">[{index}]</span>{' '}
                                    {isDeletedHereRight
                                        ? <span className="italic text-red-300">{removedRightLabel ?? '(removed or doesn\'t exist)'}</span>
                                        : (index in value ? renderValue(value[index], itemPath, isLeft) : <span className="text-gray-500 italic">(missing)</span>)}
                                </div>
                            );
                        })}
                    </div>
                );
            } else {
                const allKeys = new Set(Object.keys(value));
                if (!isLeft && highlightDiff) {
                    const parentKey = path.join('.');
                    const deletedSet = deletedKeysByParent.get(parentKey);
                    if (deletedSet) {
                        for (const k of deletedSet) {
                            if (k !== 'id') allKeys.add(k);
                        }
                    }
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
                            const itemValue = (key in value) ? value[key] : undefined;
                            const diffForClick = hasDifferenceAtPath(differences, keyPath);
                            const diffForStyle = (highlightDiff && !isLeft && key !== 'id') ? diffForClick : null;
                            const pathKey = keyPath.join('.');
                            const isCurrentDiff = currentDiffIndex !== null &&
                                visibleDifferences[currentDiffIndex]?.path.join('.') === pathKey;
                            const rightHasKey = !isLeft && Object.prototype.hasOwnProperty.call(value, key);
                            const isDeletedHereRight = !isLeft && diffForClick?.type === 'deleted' && !rightHasKey;
                            const clickable = !!diffForClick && key !== 'id' && pathIndexMap.has(pathKey);

                            const bgColor = diffForStyle && highlightDiff && key !== 'id'
                                ? isCurrentDiff
                                    ? diffForStyle.type === 'added'
                                        ? 'bg-green-700/60 border-2 border-green-400'
                                        : 'bg-red-700/60 border-2 border-red-400'
                                    : diffForStyle.type === 'added'
                                        ? 'bg-green-900/40'
                                        : 'bg-red-900/40'
                                : '';

                            return (
                                <div
                                    key={key}
                                    ref={el => {
                                        if (el) {
                                            if (isLeft) {
                                                leftElementRefs.current.set(pathKey, el);
                                            } else if (!isLeft && diffForClick && key !== 'id') {
                                                diffElementRefs.current.set(pathKey, el);
                                            }
                                        }
                                    }}
                                    onClick={clickable ? () => handlePathClick(pathKey) : undefined}
                                    role={clickable ? 'button' : undefined}
                                    className={`p-1 rounded transition-all ${bgColor} ${clickable ? 'cursor-pointer' : ''}`}
                                >
                                    <span className="text-blue-400 font-mono text-sm">{key}:</span>{' '}
                                    {isDeletedHereRight
                                        ? <span className="italic text-red-300">{removedRightLabel ?? '(removed)'}</span>
                                        : (itemValue !== undefined ? renderValue(itemValue, keyPath, isLeft) : <span className="text-gray-500 italic">(missing)</span>)}
                                </div>
                            );
                        })}
                    </div>
                );
            }
        }

        const isIdField = path.length > 0 && path[path.length - 1] === 'id';
        const diffForClick = hasDifferenceAtPath(differences, path);
        const diffForStyle = (highlightDiff && !isLeft && !isIdField) ? diffForClick : null;
        const pathKey = path.join('.');
        const isCurrentDiff = currentDiffIndex !== null &&
            visibleDifferences[currentDiffIndex]?.path.join('.') === pathKey;

        let textColor = 'text-gray-200';
        if (diffForStyle && highlightDiff && !isIdField) {
            if (isCurrentDiff) {
                textColor = diffForStyle.type === 'added' ? 'text-green-300 font-bold' : 'text-red-300 font-bold';
            } else {
                if (diffForStyle.type === 'added') {
                    textColor = 'text-green-400 font-semibold';
                } else if (diffForStyle.type === 'deleted') {
                    textColor = 'text-red-400';
                } else {
                    textColor = 'text-red-400 font-semibold';
                }
            }
        }

        const clickable = !!diffForClick && !isIdField && pathIndexMap.has(pathKey);

        return (
            <span
                ref={el => {
                    if (el) {
                        if (isLeft) {
                            leftElementRefs.current.set(pathKey, el);
                        } else if (!isLeft && diffForClick && !isIdField) {
                            diffElementRefs.current.set(pathKey, el);
                        }
                    }
                }}
                onClick={clickable ? () => handlePathClick(pathKey) : undefined}
                role={clickable ? 'button' : undefined}
                className={`${textColor} ${clickable ? 'cursor-pointer' : ''}`}
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
                                    <span className="text-red-400">Modified/Deleted (different or removed in Device B)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
