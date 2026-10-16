import {
  archiveLoot,
  getBusinessLoot,
  publishLoot,
  queryKeys,
} from '@loot/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LootList } from '@/components/LootList';
import { Button, Chip } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { usePagedList } from '@/lib/paging';
import { colors, space } from '@/theme';

const FILTERS = [
  { status: 'all_active', label: 'Live' },
  { status: 'draft', label: 'Drafts' },
  { status: 'expired', label: 'Expired' },
  { status: 'archived', label: 'Archived' },
];

export default function MyLoot() {
  const { user } = useAuth();
  const businessId = user?.businessId;
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all_active');
  const list = usePagedList(
    queryKeys.business.loots(businessId, status),
    (cursor) => getBusinessLoot({ businessId, status, cursor }),
    { enabled: Boolean(businessId) },
  );

  const refreshAll = () =>
    queryClient.invalidateQueries({ queryKey: ['business'] });
  const publish = useMutation({
    mutationFn: (lootId) => publishLoot({ lootId }),
    onSuccess: refreshAll,
  });
  const archive = useMutation({
    mutationFn: (lootId) => archiveLoot({ lootId }),
    onSuccess: refreshAll,
  });
  const failure = publish.error ?? archive.error;

  function confirmArchive(item) {
    Alert.alert(
      'Archive this loot?',
      `“${item.title}” disappears from feeds. Codes already issued stay valid.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => archive.mutate(item.id),
        },
      ],
    );
  }

  const header = (
    <View style={styles.header}>
      <Button
        title="+ New loot"
        variant="pro"
        onPress={() => router.push('/business/new-loot')}
      />
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip
            key={f.status}
            label={f.label}
            selected={status === f.status}
            color={colors.pro}
            onPress={() => setStatus(f.status)}
          />
        ))}
      </View>
      {failure ? (
        <Text style={styles.error}>{errorMessage(failure)}</Text>
      ) : null}
    </View>
  );

  return (
    <LootList
      list={list}
      header={header}
      footerFor={(item) =>
        item.status === 'draft' ? (
          <Button
            title="Publish now"
            variant="pro"
            style={styles.action}
            loading={publish.isPending && publish.variables === item.id}
            onPress={() => publish.mutate(item.id)}
          />
        ) : ['active', 'trending', 'expiring'].includes(item.status) ? (
          <Button
            title="Archive"
            variant="secondary"
            style={styles.action}
            onPress={() => confirmArchive(item)}
          />
        ) : null
      }
      empty={{
        title: status === 'all_active' ? 'No live loot' : 'Nothing here',
        message:
          status === 'all_active'
            ? 'Drop something for people nearby — it goes live instantly.'
            : undefined,
        actionLabel: 'Create loot',
        onAction: () => router.push('/business/new-loot'),
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: space.md, marginBottom: space.lg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  action: { marginTop: space.sm },
  error: { color: colors.danger },
});
