import { useMemo, useCallback } from 'react';

import { parseNotes, type ParsedSegment } from '@desktop-client/notes/linkParser';

export type TagEntry = {
    tag: string;
    content: string;
};

/**
 * Parses notes string into array of tag entries.
 * Each hashtag becomes a separate entry with its associated content.
 * Plain text (before any hashtag) is treated as content for an empty tag.
 */
export function parseTaggedNotes(notes: string): TagEntry[] {
    if (!notes || notes.trim() === '') {
        return [];
    }

    const segments = parseNotes(notes);
    const entries: TagEntry[] = [];
    let currentTag = '';
    let currentContent = '';

    for (const segment of segments) {
        if (segment.type === 'tag') {
            // Save previous entry if exists
            if (currentTag !== '' || currentContent.trim() !== '') {
                entries.push({
                    tag: currentTag,
                    content: currentContent.trim(),
                });
            }
            // Start new tag entry
            currentTag = segment.tag;
            currentContent = '';
        } else if (segment.type === 'text' || segment.type === 'link') {
            // Accumulate content
            currentContent += segment.content;
        }
    }

    // Don't forget the last entry
    if (currentTag !== '' || currentContent.trim() !== '') {
        entries.push({
            tag: currentTag,
            content: currentContent.trim(),
        });
    }

    return entries;
}

/**
 * Composes tag entries back into a formatted notes string.
 * Format: #tag content #tag2 content2
 * Empty tags result in plain text without hashtag prefix.
 */
export function composeTaggedNotes(entries: TagEntry[]): string {
    // Filter out entries with no tag and no content
    const validEntries = entries.filter(
        entry => entry.tag.trim() !== '' || entry.content.trim() !== '',
    );

    if (validEntries.length === 0) {
        return '';
    }

    return validEntries
        .map(entry => {
            if (entry.tag.trim() === '') {
                return entry.content.trim();
            }
            const tag = entry.tag.startsWith('#') ? entry.tag : `#${entry.tag}`;
            const content = entry.content.trim();
            return content ? `${tag} ${content}` : tag;
        })
        .join(' ');
}

/**
 * Hook providing utilities for parsing and composing tagged notes.
 */
export function useNotesTagEditor(initialNotes: string) {
    const initialEntries = useMemo(
        () => parseTaggedNotes(initialNotes),
        [initialNotes],
    );

    const compose = useCallback((entries: TagEntry[]) => {
        return composeTaggedNotes(entries);
    }, []);

    return {
        initialEntries,
        parseTaggedNotes,
        composeTaggedNotes: compose,
    };
}
