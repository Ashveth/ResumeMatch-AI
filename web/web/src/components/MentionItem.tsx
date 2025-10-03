import { motion } from 'framer-motion';
import type { Mention } from '../lib/api';

export function MentionItem({ mention }: { mention: Mention }) {
  const color = mention.sentimentLabel === 'negative' ? 'text-negative' : mention.sentimentLabel === 'positive' ? 'text-positive' : 'text-neutral';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-gray-200 dark:border-gray-800 p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur"
    >
      <div className="flex justify-between items-center">
        <div className={`font-medium ${color}`}>{mention.sentimentLabel ?? 'unscored'} {mention.sentimentScore != null ? `(${mention.sentimentScore.toFixed(2)})` : ''}</div>
        <div className="text-xs text-gray-500">{new Date(mention.timestamp).toLocaleString()}</div>
      </div>
      <div className="mt-1 text-sm whitespace-pre-wrap">{mention.content}</div>
      <div className="mt-2 text-xs text-gray-500">{mention.source} • @{mention.user}</div>
    </motion.div>
  );
}
