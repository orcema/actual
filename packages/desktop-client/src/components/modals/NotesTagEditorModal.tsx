import React, { useState, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd, SvgDelete } from '@actual-app/components/icons/v0';
import { SvgCheck } from '@actual-app/components/icons/v2';
import { Input } from '@actual-app/components/input';
import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { css } from '@emotion/css';

import {
    Modal,
    ModalCloseButton,
    ModalHeader,
} from '@desktop-client/components/common/Modal';
import {
    parseTaggedNotes,
    composeTaggedNotes,
    type TagEntry,
} from '@desktop-client/hooks/useNotesTagEditor';
import { type Modal as ModalType } from '@desktop-client/modals/modalsSlice';

type NotesTagEditorModalProps = Extract<
    ModalType,
    { name: 'notes-tag-editor' }
>['options'] & { initialTabIndex?: number };

// Vibrant color palette for tags
const TAG_COLORS = [
    {
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        glow: 'rgba(102, 126, 234, 0.4)',
        text: '#ffffff',
        bg: 'rgba(102, 126, 234, 0.08)',
        border: 'rgba(102, 126, 234, 0.3)',
    },
    {
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        glow: 'rgba(56, 239, 125, 0.4)',
        text: '#ffffff',
        bg: 'rgba(56, 239, 125, 0.08)',
        border: 'rgba(56, 239, 125, 0.3)',
    },
    {
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        glow: 'rgba(245, 87, 108, 0.4)',
        text: '#ffffff',
        bg: 'rgba(245, 87, 108, 0.08)',
        border: 'rgba(245, 87, 108, 0.3)',
    },
    {
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        glow: 'rgba(79, 172, 254, 0.4)',
        text: '#ffffff',
        bg: 'rgba(79, 172, 254, 0.08)',
        border: 'rgba(79, 172, 254, 0.3)',
    },
    {
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        glow: 'rgba(250, 112, 154, 0.4)',
        text: '#ffffff',
        bg: 'rgba(250, 112, 154, 0.08)',
        border: 'rgba(250, 112, 154, 0.3)',
    },
    {
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        glow: 'rgba(168, 237, 234, 0.4)',
        text: '#1a1a2e',
        bg: 'rgba(168, 237, 234, 0.08)',
        border: 'rgba(168, 237, 234, 0.3)',
    },
];

// Neutral/default color for General Notes
const NEUTRAL_COLOR = {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glow: 'rgba(102, 126, 234, 0.3)',
    text: '#ffffff',
    bg: 'rgba(128, 128, 128, 0.05)',
    border: 'rgba(128, 128, 128, 0.2)',
};

function getTagColor(index: number, hasTag: boolean) {
    if (!hasTag) return NEUTRAL_COLOR;
    return TAG_COLORS[index % TAG_COLORS.length];
}

export function NotesTagEditorModal({
    transactionId,
    notes,
    initialTabIndex,
    onSave,
}: NotesTagEditorModalProps) {
    const { t } = useTranslation();

    const [entries, setEntries] = useState<TagEntry[]>(() => {
        const parsed = parseTaggedNotes(notes || '');
        return parsed.length > 0 ? parsed : [{ tag: '', content: notes || '' }];
    });

    const [activeTab, setActiveTab] = useState<number>(() => {
        const index = initialTabIndex ?? 0;
        return index < entries.length ? index : 0;
    });
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
    const [newTagName, setNewTagName] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    const handleContentChange = useCallback(
        (index: number, content: string) => {
            setEntries(prev =>
                prev.map((entry, i) => (i === index ? { ...entry, content } : entry)),
            );
        },
        [],
    );

    const handleDeleteEntry = useCallback((index: number) => {
        setEntries(prev => prev.filter((_, i) => i !== index));
        setDeleteConfirmIndex(null);
        setActiveTab(current => {
            if (current >= index && current > 0) return current - 1;
            return current;
        });
    }, []);

    const handleAddTag = useCallback(() => {
        if (newTagName.trim()) {
            const tagName = newTagName.trim().replace(/^#/, '');
            setEntries(prev => [...prev, { tag: tagName, content: '' }]);
            setNewTagName('');
            setIsAddingTag(false);
            setActiveTab(entries.length);
        }
    }, [newTagName, entries.length]);

    const handleSave = useCallback(
        (close: () => void) => {
            const composed = composeTaggedNotes(entries);
            onSave?.(composed);
            close();
        },
        [entries, onSave],
    );

    const activeEntry = entries[activeTab];
    const activeColors = getTagColor(activeTab, !!activeEntry?.tag);

    const textareaClass = css({
        width: '100%',
        height: '100%',
        minHeight: 180,
        padding: '16px 18px',
        border: `2px solid ${activeColors.border}`,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        color: theme.tableText,
        resize: 'vertical',
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: 1.7,
        outline: 'none',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        '&:focus': {
            borderColor: activeColors.border.replace('0.3', '0.6'),
            boxShadow: `0 0 20px ${activeColors.glow}`,
        },
        '&::placeholder': {
            color: theme.pageTextSubdued,
            opacity: 0.5,
        },
    });

    const tabClass = (isActive: boolean, colors: typeof NEUTRAL_COLOR) => css({
        padding: isActive ? '8px 16px' : '6px 14px',
        borderRadius: 20,
        background: isActive ? colors.gradient : 'transparent',
        color: isActive ? colors.text : theme.pageTextSubdued,
        fontWeight: isActive ? 600 : 400,
        fontSize: 13,
        border: isActive ? 'none' : `1px solid rgba(255, 255, 255, 0.08)`,
        boxShadow: isActive ? `0 4px 15px ${colors.glow}` : 'none',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        '&:hover': {
            transform: 'scale(1.05)',
            background: isActive ? colors.gradient : 'rgba(255, 255, 255, 0.05)',
        },
    });

    return (
        <Modal
            name="notes-tag-editor"
            containerProps={{
                style: {
                    width: 560,
                    maxWidth: '95vw',
                    maxHeight: '85vh',
                },
            }}
        >
            {({ state: { close } }) => (
                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        maxHeight: '75vh',
                        position: 'relative',
                    }}
                >
                    <ModalHeader
                        title={t('Edit Notes')}
                        rightContent={<ModalCloseButton onPress={close} />}
                    />

                    {/* Delete Confirmation Overlay */}
                    {deleteConfirmIndex !== null && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.75)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 100,
                                borderRadius: 12,
                            }}
                        >
                            <View
                                style={{
                                    background: 'linear-gradient(145deg, rgba(40, 40, 60, 0.98) 0%, rgba(25, 25, 40, 0.98) 100%)',
                                    borderRadius: 16,
                                    padding: 28,
                                    maxWidth: 340,
                                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 700,
                                        marginBottom: 12,
                                        color: '#fff',
                                    }}
                                >
                                    {t('Delete Tag?')}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        marginBottom: 24,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {entries[deleteConfirmIndex]?.tag
                                        ? t('Are you sure you want to delete "#{{tag}}" and its content?', { tag: entries[deleteConfirmIndex].tag })
                                        : t('Are you sure you want to delete this note?')}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        gap: 12,
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <Button
                                        variant="bare"
                                        onPress={() => setDeleteConfirmIndex(null)}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: 10,
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: 'rgba(255, 255, 255, 0.8)',
                                        }}
                                    >
                                        <Trans>Cancel</Trans>
                                    </Button>
                                    <button
                                        onClick={() => handleDeleteEntry(deleteConfirmIndex)}
                                        className={css({
                                            padding: '10px 20px',
                                            borderRadius: 10,
                                            background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 600,
                                            fontSize: 14,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 15px rgba(245, 87, 108, 0.4)',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            '&:hover': {
                                                transform: 'scale(1.02)',
                                                boxShadow: '0 6px 20px rgba(245, 87, 108, 0.5)',
                                            },
                                        })}
                                    >
                                        {t('Delete')}
                                    </button>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Tabs Container with gradient background */}
                    <View
                        style={{
                            padding: '16px 20px',
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 100%)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 10,
                                alignItems: 'center',
                            }}
                        >
                            {entries.map((entry, index) => {
                                const colors = getTagColor(index, !!entry.tag);
                                const isActive = activeTab === index;

                                return (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            position: 'relative',
                                        }}
                                    >
                                        <button
                                            onClick={() => setActiveTab(index)}
                                            className={tabClass(isActive, colors)}
                                        >
                                            {entry.tag ? `#${entry.tag}` : t('Notes')}
                                        </button>

                                        {/* Delete button - visible on active tab */}
                                        {isActive && entries.length > 1 && (
                                            <button
                                                onClick={() => setDeleteConfirmIndex(index)}
                                                className={css({
                                                    position: 'absolute',
                                                    right: -6,
                                                    top: -6,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                                                    border: '2px solid rgba(25, 25, 40, 0.9)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(245, 87, 108, 0.5)',
                                                    transition: 'transform 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'scale(1.15)',
                                                    },
                                                })}
                                            >
                                                <SvgDelete
                                                    width={9}
                                                    height={9}
                                                    style={{ color: '#fff' }}
                                                />
                                            </button>
                                        )}
                                    </View>
                                );
                            })}

                            {/* Add Tab Button */}
                            {!isAddingTag && (
                                <button
                                    onClick={() => setIsAddingTag(true)}
                                    className={css({
                                        padding: '6px 14px',
                                        borderRadius: 20,
                                        background: 'transparent',
                                        border: '1px dashed rgba(102, 126, 234, 0.5)',
                                        color: '#667eea',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            background: 'rgba(102, 126, 234, 0.1)',
                                            borderColor: '#667eea',
                                        },
                                    })}
                                >
                                    <SvgAdd width={10} height={10} />
                                    <Trans>Add</Trans>
                                </button>
                            )}
                        </View>
                    </View>

                    {/* Add Tag Input */}
                    {isAddingTag && (
                        <View
                            style={{
                                padding: '14px 20px',
                                background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                                borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 700,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    #
                                </Text>
                                <Input
                                    value={newTagName}
                                    onChangeValue={setNewTagName}
                                    placeholder={t('tag-name')}
                                    style={{
                                        flex: 1,
                                        borderRadius: 8,
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            handleAddTag();
                                        } else if (e.key === 'Escape') {
                                            setIsAddingTag(false);
                                            setNewTagName('');
                                        }
                                    }}
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddTag}
                                    className={css({
                                        padding: '8px 18px',
                                        borderRadius: 8,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            transform: 'scale(1.02)',
                                        },
                                    })}
                                >
                                    {t('Add')}
                                </button>
                                <Button
                                    variant="bare"
                                    onPress={() => {
                                        setIsAddingTag(false);
                                        setNewTagName('');
                                    }}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: 8,
                                        fontSize: 13,
                                    }}
                                >
                                    <Trans>Cancel</Trans>
                                </Button>
                            </View>
                        </View>
                    )}

                    {/* Content Area with themed background */}
                    <View
                        style={{
                            flex: 1,
                            padding: 20,
                            background: `linear-gradient(180deg, ${activeColors.bg} 0%, transparent 100%)`,
                            transition: 'background 0.3s ease',
                        }}
                    >
                        {activeEntry && (
                            <View style={{ height: '100%' }}>
                                {/* Tag indicator */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                        gap: 8,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 4,
                                            height: 20,
                                            borderRadius: 2,
                                            background: activeColors.gradient,
                                            boxShadow: `0 0 10px ${activeColors.glow}`,
                                        }}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: theme.pageTextSubdued,
                                            textTransform: 'uppercase',
                                            letterSpacing: 1,
                                        }}
                                    >
                                        {activeEntry.tag ? `#${activeEntry.tag}` : t('General Notes')}
                                    </Text>
                                </View>

                                <textarea
                                    key={activeTab}
                                    value={activeEntry.content}
                                    onChange={e => handleContentChange(activeTab, e.target.value)}
                                    placeholder={
                                        activeEntry.tag
                                            ? t('Enter content for #{{tag}}...', { tag: activeEntry.tag })
                                            : t('Enter your notes...')
                                    }
                                    className={textareaClass}
                                    autoFocus
                                />
                            </View>
                        )}
                    </View>

                    {/* Footer with gradient save button */}
                    <View
                        style={{
                            padding: '16px 20px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 100%)',
                        }}
                    >
                        <button
                            onClick={() => handleSave(close)}
                            className={css({
                                width: '100%',
                                padding: '14px 24px',
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                boxShadow: '0 6px 25px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 10px 35px rgba(102, 126, 234, 0.5)',
                                },
                                '&:active': {
                                    transform: 'translateY(0)',
                                },
                            })}
                        >
                            <SvgCheck width={16} height={16} />
                            {t('Save Notes')}
                        </button>
                    </View>
                </View>
            )}
        </Modal>
    );
}
