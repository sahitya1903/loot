import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { LootCard } from '@/components/LootCard';
import { StateView } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { useWatchLoot } from '@/lib/realtime';
import { colors, space } from '@/theme';

/**
 * A paged list of loot cards with loading, empty, error and pull-to-refresh states.
 * @param {{ list: ReturnType<typeof import('@/lib/paging').usePagedList>, empty: object, footerFor?: Function, header?: any }} props
 */
export function LootList({ list, empty, footerFor, header }) {
  useWatchLoot(list.items.map((item) => item.id));

  let emptyView;
  if (list.isPending) emptyView = <StateView loading />;
  else if (list.isError)
    emptyView = (
      <StateView
        error
        message={errorMessage(list.error)}
        onAction={() => list.refetch()}
      />
    );
  else emptyView = <StateView empty {...empty} />;

  return (
    <FlatList
      data={list.items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <LootCard item={item} footer={footerFor?.(item)} />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyView}
      ListFooterComponent={
        list.isFetchingNextPage ? (
          <ActivityIndicator color={colors.accent} style={styles.footer} />
        ) : null
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.content}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl
          refreshing={list.isRefetching && !list.isFetchingNextPage}
          onRefresh={() => list.refetch()}
          tintColor={colors.accent}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, flexGrow: 1 },
  separator: { height: space.lg },
  footer: { marginVertical: space.lg },
});
