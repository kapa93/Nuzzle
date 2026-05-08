import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '@/navigation/types';
import { LEGAL_DOCUMENTS } from '@/content/legalDocuments';
import { colors } from '@/theme';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';

type LegalRoute = RouteProp<AuthStackParamList, 'LegalDocument'>;

export function LegalDocumentScreen() {
  const route = useRoute<LegalRoute>();
  const headerHeight = useStackHeaderHeight();
  const document = LEGAL_DOCUMENTS[route.params.documentType];

  if (!document) {
    return (
      <View style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Document not found.</Text>
        </View>
      </View>
    );
  }

  const lines = document.content.split('\n');

  const renderInline = (value: string) => {
    const normalized = value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    const nodes: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let start = 0;
    let match: RegExpExecArray | null;

    while ((match = boldRegex.exec(normalized)) !== null) {
      if (match.index > start) {
        nodes.push(normalized.slice(start, match.index));
      }
      nodes.push(
        <Text key={`b-${match.index}`} style={styles.bold}>
          {match[1]}
        </Text>
      );
      start = match.index + match[0].length;
    }

    if (start < normalized.length) {
      nodes.push(normalized.slice(start));
    }

    return nodes.length > 0 ? nodes : normalized;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + 25 },
        ]}
      >
        <Text style={styles.title}>{document.title}</Text>
        <View style={styles.markdownContainer}>
          {lines.map((line, index) => {
            const trimmed = line.trim();

            // Hide the markdown document title because screen title already displays it.
            if (index === 0 && trimmed.startsWith('# ')) {
              return null;
            }

            if (trimmed === '---') {
              return <View key={`hr-${index}`} style={styles.hr} />;
            }

            if (!trimmed) {
              return <View key={`sp-${index}`} style={styles.spacer} />;
            }

            if (trimmed.startsWith('### ')) {
              return (
                <Text key={`h3-${index}`} style={styles.h3}>
                  {renderInline(trimmed.slice(4))}
                </Text>
              );
            }

            if (trimmed.startsWith('## ')) {
              return (
                <Text key={`h2-${index}`} style={styles.h2}>
                  {renderInline(trimmed.slice(3))}
                </Text>
              );
            }

            if (trimmed.startsWith('- ')) {
              return (
                <Text key={`li-${index}`} style={styles.listItem}>
                  {'\u2022'} {renderInline(trimmed.slice(2))}
                </Text>
              );
            }

            return (
              <Text key={`p-${index}`} style={styles.body}>
                {renderInline(trimmed)}
              </Text>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  markdownContainer: {
    gap: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSupporting,
  },
  h2: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSupporting,
    paddingLeft: 4,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hr: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  spacer: {
    height: 8,
  },
});
