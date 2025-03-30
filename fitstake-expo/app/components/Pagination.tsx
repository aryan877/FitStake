import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

const { colors } = theme;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Handle edge cases
  if (totalPages <= 1) return null;

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxDisplayed = 5; // Maximum number of page buttons to show

    if (totalPages <= maxDisplayed) {
      // Show all pages if there are less than maxDisplayed
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first and last page
      pages.push(1);

      // Calculate middle pages to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust range if at start or end
      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }

      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Add last page if not already included
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <View style={styles.container}>
      {/* Previous Button */}
      <TouchableOpacity
        onPress={goToPreviousPage}
        disabled={currentPage === 1}
        style={[styles.arrowButton, currentPage === 1 && styles.disabledButton]}
      >
        <ChevronLeft
          size={20}
          color={currentPage === 1 ? colors.gray[600] : colors.gray[300]}
        />
      </TouchableOpacity>

      {/* Page Numbers */}
      <View style={styles.pageNumbersContainer}>
        {pageNumbers.map((page, index) => {
          const isCurrentPage = page === currentPage;
          const isEllipsis = page === '...';

          return (
            <TouchableOpacity
              key={`page-${index}`}
              onPress={() => (isEllipsis ? null : onPageChange(page as number))}
              disabled={isEllipsis || isCurrentPage}
              style={[
                styles.pageButton,
                isCurrentPage && styles.currentPageButton,
                isEllipsis && styles.ellipsisButton,
              ]}
            >
              <Text
                style={[
                  styles.pageText,
                  isCurrentPage && styles.currentPageText,
                ]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Next Button */}
      <TouchableOpacity
        onPress={goToNextPage}
        disabled={currentPage === totalPages}
        style={[
          styles.arrowButton,
          currentPage === totalPages && styles.disabledButton,
        ]}
      >
        <ChevronRight
          size={20}
          color={
            currentPage === totalPages ? colors.gray[600] : colors.gray[300]
          }
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    width: '100%',
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: colors.gray[800],
  },
  currentPageButton: {
    backgroundColor: colors.accent.primary,
  },
  ellipsisButton: {
    backgroundColor: 'transparent',
  },
  pageText: {
    color: colors.gray[300],
    fontFamily: 'System',
    fontSize: 14,
  },
  currentPageText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[800],
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  disabledButton: {
    backgroundColor: colors.gray[900],
  },
});

export default Pagination;
