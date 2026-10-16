import { getMySavedLoot, queryKeys } from '@loot/shared';
import { router } from 'expo-router';
import { LootList } from '@/components/LootList';
import { useAuth } from '@/lib/auth';
import { usePagedList } from '@/lib/paging';

export default function Saved() {
  const { user } = useAuth();
  const list = usePagedList(
    queryKeys.user.saved(user?.userId ?? 'me'),
    (cursor) => getMySavedLoot({ cursor }),
  );
  return (
    <LootList
      list={list}
      empty={{
        title: 'Nothing saved yet',
        message: 'Save loot to come back to it before it runs out.',
        actionLabel: 'Browse nearby',
        onAction: () => router.navigate('/'),
      }}
    />
  );
}
