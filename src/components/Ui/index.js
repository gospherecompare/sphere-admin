/**
 * UI Components Index
 * Central export point for all ERP and responsive components
 */

// ===================== ERP Basic Components =====================
export {
  Button,
  Input,
  Select,
  Alert,
  Badge,
  StatCard,
  ProgressBar,
  Spinner,
} from "./ERPComponents";

// ===================== ERP Advanced Components =====================
export {
  AdvancedDataTable,
  Form,
  Modal,
  Tabs,
  Accordion,
} from "./AdvancedComponents";

// ===================== Advanced ERP Form Components =====================
export {
  ERPForm,
  FormSection,
  FormField,
  ERPInput,
  ERPTextarea,
  FormActions,
  ERPCheckbox,
  ERPRadio,
} from "./ERPForm";

// ===================== Advanced ERP Select Components =====================
export { ERPMultiSelect, ERPSelect } from "./ERPSelect";

// ===================== Advanced ERP Data Table =====================
export { ERPDataTable } from "./ERPDataTable";

// ===================== Responsive Layout Components =====================
export {
  ResponsiveLayout,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveFlex,
  ResponsiveCard,
  ResponsiveSection,
  ResponsiveTable,
  ResponsiveModal,
} from "./ResponsiveLayoutComponents";

// ===================== Layout Wrapper Components =====================
export { ResponsiveMainLayout } from "@/components/layout/ResponsiveMainLayout";

export {
  ResponsiveSidebarWrapper,
  ResponsiveSidebarItem,
  ResponsiveSidebarSection,
} from "@/components/layout/ResponsiveSidebarWrapper";

export {
  ResponsiveNavbarWrapper,
  ResponsiveSearchBar,
  ResponsiveNavButton,
  ResponsiveNavDivider,
} from "@/components/layout/ResponsiveNavbarWrapper";

export {
  ResponsiveDashboardHeader,
  ResponsiveDashboardContent,
  ResponsiveStatGrid,
  ResponsiveContentCard,
  ResponsiveFormSection,
  ResponsiveTableSection,
  ResponsiveDashboardSidebar,
  ResponsiveDashboardMain,
  ResponsiveActionBar,
} from "@/components/layout/ResponsiveDashboardLayout";

export {
  ResponsivePageWrapper,
  ResponsivePageSection,
  ResponsiveTwoColumn,
  ResponsiveThreeColumn,
  ResponsiveCardGrid,
  ResponsiveItemCard,
} from "@/components/layout/GlobalResponsiveWrapper";

// ===================== Existing Components (Re-exports) =====================
export { default as HookLogo } from "./hooklogo";
export { default as LoadingSpinner } from "./LoadingSpinner";

// ===================== Theme & Config =====================
export { default as erpTheme } from "@/config/erp-theme";

/**
 * Quick Import Guide:
 *
 * // Basic Components
 * import { Button, Input, Alert, Badge } from '@/components/ui';
 *
 * // Advanced Components
 * import { AdvancedDataTable, Modal, Tabs } from '@/components/ui';
 *
 * // Layout Components
 * import { ResponsiveLayout, ResponsiveContainer, ResponsiveGrid } from '@/components/ui';
 *
 * // Hooks
 * import { useResponsive, useIsMobile } from '@/hooks/useResponsive';
 *
 * // Theme
 * import { colors, spacing, typography } from '@/config/erp-theme';
 */
