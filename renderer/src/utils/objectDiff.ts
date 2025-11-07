import Diff from 'deep-diff';

export type DiffType = 'added' | 'deleted' | 'modified' | 'unchanged';

export interface DiffPath {
    path: string[];
    type: DiffType;
    oldValue?: any;
    newValue?: any;
}

function removeIds(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => removeIds(item));
    }
    if (typeof obj === 'object') {
        const result: any = {};
        Object.keys(obj).forEach(key => {
            if (key !== 'id') {
                result[key] = removeIds(obj[key]);
            }
        });
        return result;
    }
    return obj;
}

export function compareObjects(left: any, right: any): DiffPath[] {
    if (!left && !right) return [];

    const leftWithoutIds = left ? removeIds(JSON.parse(JSON.stringify(left))) : left;
    const rightWithoutIds = right ? removeIds(JSON.parse(JSON.stringify(right))) : right;

    if (!leftWithoutIds) {
        return extractAllPaths(rightWithoutIds, [], 'added').filter(d => d.path[d.path.length - 1] !== 'id');
    }
    if (!rightWithoutIds) {
        return extractAllPaths(leftWithoutIds, [], 'deleted').filter(d => d.path[d.path.length - 1] !== 'id');
    }

    const differences = Diff.diff(leftWithoutIds, rightWithoutIds);
    if (!differences) return [];

    const result: DiffPath[] = [];

    differences.forEach(diff => {
        const path = diff.path || [];
        if (path.length > 0 && path[path.length - 1] === 'id') {
            return;
        }
        switch (diff.kind) {
            case 'N':
                result.push({
                    path: path,
                    type: 'added',
                    newValue: diff.rhs,
                });
                break;
            case 'D':
                result.push({
                    path: path,
                    type: 'deleted',
                    oldValue: diff.lhs,
                });
                break;
            case 'E':
                result.push({
                    path: path,
                    type: 'modified',
                    oldValue: diff.lhs,
                    newValue: diff.rhs,
                });
                break;
            case 'A':
                if (diff.path) {
                    const arrayPath = [...diff.path, diff.index?.toString() || ''];
                    if (diff.item) {
                        const itemPath = diff.item.path || [];
                        if (itemPath.length > 0 && itemPath[itemPath.length - 1] === 'id') {
                            return;
                        }
                        switch (diff.item.kind) {
                            case 'N':
                                result.push({
                                    path: arrayPath,
                                    type: 'added',
                                    newValue: diff.item.rhs,
                                });
                                break;
                            case 'D':
                                result.push({
                                    path: arrayPath,
                                    type: 'deleted',
                                    oldValue: diff.item.lhs,
                                });
                                break;
                            case 'E':
                                result.push({
                                    path: arrayPath,
                                    type: 'modified',
                                    oldValue: diff.item.lhs,
                                    newValue: diff.item.rhs,
                                });
                                break;
                        }
                    }
                }
                break;
        }
    });

    return result;
}

function extractAllPaths(obj: any, currentPath: string[], type: DiffType): DiffPath[] {
    const result: DiffPath[] = [];

    if (obj === null || obj === undefined) {
        return result;
    }

    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            const newPath = [...currentPath, index.toString()];
            if (typeof item === 'object' && item !== null) {
                result.push(...extractAllPaths(item, newPath, type));
            } else {
                result.push({
                    path: newPath,
                    type: type,
                    newValue: type === 'added' ? item : undefined,
                    oldValue: type === 'deleted' ? item : undefined,
                });
            }
        });
    } else if (typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
            const newPath = [...currentPath, key];
            const value = obj[key];
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                result.push(...extractAllPaths(value, newPath, type));
            } else {
                result.push({
                    path: newPath,
                    type: type,
                    newValue: type === 'added' ? value : undefined,
                    oldValue: type === 'deleted' ? value : undefined,
                });
            }
        });
    } else {
        result.push({
            path: currentPath,
            type: type,
            newValue: type === 'added' ? obj : undefined,
            oldValue: type === 'deleted' ? obj : undefined,
        });
    }

    return result;
}

export function getValueByPath(obj: any, path: string[]): any {
    let current = obj;
    for (const key of path) {
        if (current === null || current === undefined) {
            return undefined;
        }
        if (Array.isArray(current) && !isNaN(Number(key))) {
            current = current[Number(key)];
        } else {
            current = current[key];
        }
    }
    return current;
}

export function hasDifferenceAtPath(differences: DiffPath[], path: string[]): DiffPath | null {
    const pathStr = path.join('.');
    return differences.find(diff => diff.path.join('.') === pathStr) || null;
}
