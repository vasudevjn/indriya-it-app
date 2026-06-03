import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { CommentWithAuthor } from '../../types/ticket';
import { timeAgo } from '../../lib/utils/date';

interface Props {
  comment: CommentWithAuthor;
  isOwnComment: boolean;
}

export function CommentBubble({ comment, isOwnComment }: Props) {
  const isInternal = comment.is_internal;
  const initials = (comment.author?.full_name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.row, isOwnComment ? styles.rowRight : styles.rowLeft]}>
      {/* Avatar — only for other people's messages */}
      {!isOwnComment && (
        <View style={[styles.avatar, isInternal && styles.avatarInternal]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isOwnComment ? styles.bubbleOwn : styles.bubbleOther,
          isInternal && styles.bubbleInternal,
        ]}
      >
        {/* Author name */}
        <View style={styles.authorRow}>
          {isInternal && (
            <Ionicons name="lock-closed" size={11} color={isOwnComment ? 'rgba(255,255,255,0.6)' : '#8B5CF6'} />
          )}
          <Text style={[styles.author, isOwnComment ? styles.authorOwn : styles.authorOther]}>
            {isOwnComment ? 'You' : (comment.author?.full_name ?? 'Unknown')}
          </Text>
        </View>

        {/* Message body */}
        <Text style={[styles.body, isOwnComment && styles.bodyOwn]}>{comment.body}</Text>

        {/* Timestamp */}
        <Text style={[styles.time, isOwnComment && styles.timeOwn]}>{timeAgo(comment.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 3,
    alignItems: 'flex-end',
    gap: 6,
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0EAF6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  avatarInternal: {
    backgroundColor: '#EDE9FE',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B3A7A',
  },

  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: '#1B3A7A',
    borderBottomRightRadius: 4,
  },
  bubbleInternal: {
    backgroundColor: '#F5F0FF',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderBottomLeftRadius: 4,
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  author: {
    fontSize: 11,
    fontWeight: '700',
  },
  authorOther: {
    color: '#6B7280',
  },
  authorOwn: {
    color: 'rgba(255,255,255,0.65)',
  },

  body: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  bodyOwn: {
    color: '#fff',
  },

  time: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.5)',
  },
});
