import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { SvgFilter2, SvgPencil1 } from '@actual-app/components/icons/v2';
import { css } from '@emotion/css';

import { parseTaggedNotes, type TagEntry } from '@desktop-client/hooks/useNotesTagEditor';

// Color palette for tag items
const TAG_COLORS = [
    { bg: 'rgba(102, 126, 234, 0.15)', border: 'rgba(102, 126, 234, 0.4)', text: '#667eea' },
    { bg: 'rgba(56, 239, 125, 0.15)', border: 'rgba(56, 239, 125, 0.4)', text: '#38ef7d' },
    { bg: 'rgba(245, 87, 108, 0.15)', border: 'rgba(245, 87, 108, 0.4)', text: '#f5576c' },
    { bg: 'rgba(79, 172, 254, 0.15)', border: 'rgba(79, 172, 254, 0.4)', text: '#4facfe' },
    { bg: 'rgba(250, 112, 154, 0.15)', border: 'rgba(250, 112, 154, 0.4)', text: '#fa709a' },
    { bg: 'rgba(168, 237, 234, 0.15)', border: 'rgba(168, 237, 234, 0.4)', text: '#68d8d6' },
];

function getTagColor(index: number) {
    return TAG_COLORS[index % TAG_COLORS.length];
}

const NEUTRAL_COLORS = {
    bg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
    text: 'rgba(255, 255, 255, 0.6)',
};

type NotesTagHoverPopupProps = {
    notes: string;
    onTagFilter: (tag: string) => void;
    onEditNotes?: (index?: number) => void;
    children: React.ReactNode;
};

export function NotesTagHoverPopup({
    notes,
    onTagFilter,
    onEditNotes,
    children,
}: NotesTagHoverPopupProps) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [hoveredTagIndex, setHoveredTagIndex] = useState<number | null>(null);
    const [showContentPreview, setShowContentPreview] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Parse tags from notes
    const entries = parseTaggedNotes(notes || '');

    // Only show popup if there is any content (tagged or not)
    const hasContent = notes && notes.trim().length > 0;

    const handleFocus = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        if (hasContent) {
            setIsVisible(true);
        }
    }, [hasContent]);

    const handleBlur = useCallback((e: React.FocusEvent) => {
        // If the new focused element is inside the same container, don't hide
        if (containerRef.current?.contains(e.relatedTarget as Node)) {
            return;
        }

        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            setHoveredTagIndex(null);
            setShowContentPreview(null);
        }, 150);
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const liftedElements: HTMLElement[] = [];
        let current: HTMLElement | null = containerRef.current;

        // Traverse up to find and elevate all potential stacking context containers
        while (current && current.parentElement && current.tagName !== 'BODY') {
            const style = window.getComputedStyle(current);
            // Elevate any element that could be a stacking context or a row container
            if (
                style.position !== 'static' ||
                current.getAttribute('data-testid') === 'row' ||
                (current.style.position === 'absolute' && current.style.top)
            ) {
                current.style.zIndex = '1000000';
                liftedElements.push(current);
            }

            // Stop once we've reached what looks like the row wrapper in the virtualized list
            if (current.style.position === 'absolute' && current.style.top) {
                break;
            }

            current = current.parentElement;
        }

        return () => {
            liftedElements.forEach(el => {
                el.style.zIndex = '';
            });
        };
    }, [isVisible]);

    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    const actionButtonClass = css({
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        '&:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
            transform: 'scale(1.1)',
        },
    });

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                display: 'flex',
                flex: 1,
                minWidth: 0,
                height: '100%',
                alignItems: 'stretch',
                zIndex: isVisible ? 20000 : undefined,
            }}
            onFocusCapture={handleFocus}
            onBlurCapture={handleBlur}
        >
            <div style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'stretch',
            }}>
                {children}
            </div>

            {/* Popup */}
            {isVisible && (
                <div
                    onFocusCapture={handleFocus}
                    onBlurCapture={handleBlur}
                    className={css({
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 4,
                        minWidth: 220,
                        maxWidth: 300,
                        backgroundColor: 'rgb(25, 25, 40)',
                        background: 'linear-gradient(145deg, rgba(35, 35, 50, 1) 0%, rgba(25, 25, 40, 1) 100%)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 12,
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                        padding: 8,
                        zIndex: 100001,
                        animation: 'fadeIn 0.15s ease-out',
                        '@keyframes fadeIn': {
                            from: { opacity: 0, transform: 'translateY(-4px)' },
                            to: { opacity: 1, transform: 'translateY(0)' },
                        },
                    })}
                >
                    {/* Header */}
                    <Text
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.4)',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            padding: '4px 8px 8px',
                        }}
                    >
                        {t('Tags')}
                    </Text>

                    {/* Tag list (including untagged content) */}
                    {entries
                        .map((entry, index) => {
                            const colors = entry.tag ? getTagColor(index) : NEUTRAL_COLORS;
                            const isHovered = hoveredTagIndex === index;
                            const showPreview = showContentPreview === index;

                            // Skip empty untagged entries if there are tags
                            if (entry.tag === '' && !entry.content.trim() && entries.length > 1) {
                                return null;
                            }

                            return (
                                <div
                                    key={index}
                                    onMouseEnter={() => {
                                        setHoveredTagIndex(index);
                                        setShowContentPreview(index);
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredTagIndex(null);
                                        setShowContentPreview(null);
                                    }}
                                    className={css({
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        backgroundColor: isHovered ? colors.bg : 'transparent',
                                        transition: 'background-color 0.2s ease',
                                        marginBottom: 2,
                                    })}
                                >
                                    {/* Tag entry label */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                            flex: 1,
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 3,
                                                height: 16,
                                                borderRadius: 2,
                                                backgroundColor: colors.text,
                                            }}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: colors.text,
                                            }}
                                        >
                                            {entry.tag || t('General Notes')}
                                        </Text>
                                    </View>

                                    {/* Action icons - appear on hover */}
                                    {isHovered && (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                animation: 'slideIn 0.15s ease-out',
                                            }}
                                            className={css({
                                                '@keyframes slideIn': {
                                                    from: { opacity: 0, transform: 'translateX(10px)' },
                                                    to: { opacity: 1, transform: 'translateX(0)' },
                                                },
                                            })}
                                        >
                                            {/* Edit button */}
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    onEditNotes?.(index);
                                                }}
                                                className={actionButtonClass}
                                                title={t('Edit notes')}
                                            >
                                                <SvgPencil1
                                                    width={14}
                                                    height={14}
                                                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                                />
                                            </button>

                                            {/* Filter button - only for actual tags */}
                                            {entry.tag && (
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onTagFilter(entry.tag);
                                                        setIsVisible(false);
                                                    }}
                                                    className={actionButtonClass}
                                                    title={t('Filter by this tag')}
                                                >
                                                    <SvgFilter2
                                                        width={13}
                                                        height={13}
                                                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                                    />
                                                </button>
                                            )}
                                        </View>
                                    )}

                                    {/* Content preview tooltip */}
                                    {showPreview && entry.content && (
                                        <div
                                            className={css({
                                                position: 'absolute',
                                                right: '100%',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                marginRight: 8,
                                                minWidth: 180,
                                                maxWidth: 250,
                                                background: 'linear-gradient(145deg, rgba(45, 45, 65, 0.98) 0%, rgba(30, 30, 45, 0.98) 100%)',
                                                borderRadius: 10,
                                                border: `1px solid ${colors.border}`,
                                                boxShadow: `0 8px 30px rgba(0, 0, 0, 0.3), 0 0 15px ${colors.bg}`,
                                                padding: 12,
                                                zIndex: 1001,
                                                animation: 'fadeIn 0.15s ease-out',
                                            })}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: colors.text,
                                                    marginBottom: 6,
                                                    display: 'block',
                                                }}
                                            >
                                                {entry.tag || t('General Notes')}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    color: 'rgba(255, 255, 255, 0.75)',
                                                    lineHeight: 1.5,
                                                    display: 'block',
                                                }}
                                            >
                                                {entry.content.length > 100
                                                    ? `${entry.content.slice(0, 100)}...`
                                                    : entry.content}
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
