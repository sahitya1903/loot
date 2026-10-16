import { getMyClaimedLoot, queryKeys } from '@loot/shared';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LootList } from '@/components/LootList';
import { RedemptionCard } from '@/components/RedemptionCard';
import { useAuth } from '@/lib/auth';
import { usePagedList } from '@/lib/paging';
import { space } from '@/theme';

export default function Claims() {
  const { user } = useAuth();
  const list = usePagedList(
    queryKeys.user.claimed(user?.userId ?? 'me'),
    (cursor) => getMyClaimedLoot({ cursor }),
  );
  return (
    <LootList
      list={list}
      footerFor={(item) =>
        item.redemption ? (
          <View style={styles.code}>
            <RedemptionCard redemption={item.redemption} compact />
          </View>
        ) : null
      }
      empty={{
        title: 'No claims yet',
        message:
          'Claim loot nearby and your codes show up here, ready for the counter.',
        actionLabel: 'Find loot',
        onAction: () => router.navigate('/'),
      }}
    />
  );
}

const styles = StyleSheet.create({ code: { marginTop: space.sm } });
