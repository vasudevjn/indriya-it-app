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

  return (
    <View style={[styles.row, isOwnComment && styles.rowRight]}>
      <View
        style={[
          styles.bubble,
          isOwnComment && styles.bubbleOwn,
          isInternal && styles.bubbleInternal,
        ]}
      >
        <View style={styles.authorRow}>
          <Text style={[styles.author, isOwnComment && styles.authorOwn]}>
            {comment.author?.full_name ?? 'Unknown'}
          </Text>
          {isInternal && (
            <Ionicons name="lock-closed" size={12} color="#8B5CF6" style={styles.lockIcon} />
          )}
        </View>
        <Text style={[styles.body, isOwnComment && styles.bodyOwn]}>{comment.body}</Text>
        <Text style={[styles.time, isOwnComment && styles.timeOwn]}>{timeAgo(comment.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  bubbleOwn: {
    backgroundColor: '#1B3A7A',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleInternal: {
    borderWidth: 1,
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  author: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  authorOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  lockIcon: {
    marginLeft: 2,
  },
  body: {
    fontSize: 14,
    color: '#111827',
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
    color: 'rgba(255,255,255,0.6)',
  },
});
