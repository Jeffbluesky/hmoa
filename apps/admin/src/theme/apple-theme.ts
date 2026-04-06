import { ThemeConfig } from 'antd';

/**
 * Apple Design System Theme for Ant Design
 * Based on DESIGN_apple.md specifications
 */
export const appleTheme: ThemeConfig = {
  token: {
    // ===== Colors =====
    colorPrimary: '#0071e3', // Apple Blue
    colorSuccess: '#34c759', // Apple Green
    colorWarning: '#ff9500', // Apple Orange
    colorError: '#ff3b30', // Apple Red
    colorInfo: '#0071e3', // Apple Blue

    // ===== Background Colors =====
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f7', // Apple light gray
    colorBgElevated: '#ffffff',
    colorBgSpotlight: 'rgba(0, 0, 0, 0.8)',

    // ===== Text Colors =====
    colorText: 'rgba(0, 0, 0, 0.8)', // Apple black 80%
    colorTextSecondary: 'rgba(0, 0, 0, 0.48)', // Apple black 48%
    colorTextTertiary: 'rgba(0, 0, 0, 0.32)',
    colorTextQuaternary: 'rgba(0, 0, 0, 0.16)',

    // ===== Border Colors =====
    colorBorder: 'rgba(0, 0, 0, 0.08)',
    colorBorderSecondary: 'rgba(0, 0, 0, 0.04)',

    // ===== Font =====
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: 14,

    // ===== Border Radius =====
    borderRadius: 8, // Apple standard radius
    borderRadiusLG: 12, // Apple large radius
    borderRadiusSM: 5, // Apple micro radius
    borderRadiusXS: 2,

    // ===== Control Heights =====
    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 44,
    controlHeightXS: 22,

    // ===== Spacing =====
    marginXXS: 2,
    marginXS: 4,
    marginSM: 8,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
    marginXXL: 48,

    paddingXXS: 2,
    paddingXS: 4,
    paddingSM: 8,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,
    paddingXL: 32,

    // ===== Motion =====
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },

  components: {
    // ===== Button =====
    Button: {
      borderRadius: 8,
      borderRadiusLG: 8,
      borderRadiusSM: 5,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      paddingContentHorizontal: 15,
      paddingContentHorizontalLG: 19,
      paddingContentHorizontalSM: 11,
      colorPrimary: '#0071e3',
      colorPrimaryHover: '#0077ed',
      colorPrimaryActive: '#006ed6',
      colorPrimaryBg: '#0071e3',
      colorPrimaryBgHover: '#0077ed',
      colorPrimaryBorder: '#0071e3',
      colorPrimaryBorderHover: '#0077ed',
      colorPrimaryText: '#ffffff',
      colorPrimaryTextHover: '#ffffff',
      colorPrimaryTextActive: '#ffffff',
      fontWeight: 400,
    },

    // ===== Card =====
    Card: {
      borderRadius: 8,
      borderRadiusLG: 12,
      colorBgContainer: '#ffffff',
      boxShadow: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
      boxShadowTertiary: 'none',
      colorBorderSecondary: 'transparent',
      padding: 20,
      paddingLG: 24,
      paddingSM: 16,
    },

    // ===== Menu =====
    Menu: {
      itemColor: 'rgba(0, 0, 0, 0.8)',
      itemHoverColor: '#0071e3',
      itemSelectedColor: '#0071e3',
      itemSelectedBg: 'rgba(0, 113, 227, 0.08)',
      itemBorderRadius: 8,
      itemMarginInline: 0,
      itemPaddingInline: 12,
      horizontalItemBorderRadius: 8,
      horizontalItemSelectedColor: '#0071e3',
      horizontalItemSelectedBg: 'rgba(0, 113, 227, 0.08)',
      horizontalItemHoverColor: '#0071e3',
      horizontalItemHoverBg: 'rgba(0, 113, 227, 0.04)',
      subMenuItemBorderRadius: 8,
      groupTitleColor: 'rgba(0, 0, 0, 0.48)',
      iconSize: 16,
      iconMarginInlineEnd: 8,
    },

    // ===== Table =====
    Table: {
      borderRadius: 8,
      headerBg: '#f5f5f7',
      headerColor: 'rgba(0, 0, 0, 0.8)',
      headerSplitColor: 'transparent',
      rowHoverBg: 'rgba(0, 113, 227, 0.04)',
      rowSelectedBg: 'rgba(0, 113, 227, 0.08)',
      rowSelectedHoverBg: 'rgba(0, 113, 227, 0.12)',
      colorBorderSecondary: 'rgba(0, 0, 0, 0.04)',
      padding: 16,
      paddingSM: 12,
      paddingXS: 8,
      cellPaddingInline: 16,
      cellPaddingBlock: 12,
      headerBorderRadius: 8,
    },

    // ===== Input =====
    Input: {
      borderRadius: 11, // Apple comfortable radius
      borderRadiusLG: 11,
      borderRadiusSM: 8,
      colorBgContainer: '#ffffff',
      colorBorder: 'rgba(0, 0, 0, 0.08)',
      colorPrimaryHover: '#0071e3',
      colorPrimary: '#0071e3',
      activeBorderColor: '#0071e3',
      hoverBorderColor: '#0071e3',
      paddingInline: 12,
      paddingInlineLG: 14,
      paddingInlineSM: 10,
      paddingBlock: 8,
      paddingBlockLG: 10,
      paddingBlockSM: 6,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },

    // ===== Modal =====
    Modal: {
      borderRadius: 12, // Apple large radius
      borderRadiusLG: 12,
      boxShadow: '0 10px 60px rgba(0, 0, 0, 0.2)',
      colorBgMask: 'rgba(0, 0, 0, 0.4)',
      paddingContentHorizontal: 24,
      paddingContentHorizontalLG: 32,
      paddingContentHorizontalSM: 16,
      paddingMD: 24,
      paddingLG: 32,
      paddingSM: 16,
      titleFontSize: 20,
      titleLineHeight: 1.4,
    },

    // ===== Select =====
    Select: {
      borderRadius: 11,
      borderRadiusLG: 11,
      borderRadiusSM: 8,
      colorBorder: 'rgba(0, 0, 0, 0.08)',
      hoverBorderColor: '#0071e3',
      colorPrimary: '#0071e3',
      colorPrimaryHover: '#0071e3',
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      optionSelectedBg: 'rgba(0, 113, 227, 0.08)',
      optionSelectedColor: '#0071e3',
      optionSelectedFontWeight: 400,
    },

    // ===== Form =====
    Form: {
      labelColor: 'rgba(0, 0, 0, 0.8)',
      labelFontSize: 14,
      labelHeight: 20,
      labelRequiredMarkColor: '#ff3b30',
      itemMarginBottom: 20,
    },

    // ===== Divider =====
    Divider: {
      colorSplit: 'rgba(0, 0, 0, 0.04)',
      margin: 24,
      marginLG: 32,
      marginSM: 16,
    },

    // ===== Layout =====
    Layout: {
      colorBgHeader: 'rgba(0, 0, 0, 0.8)',
      colorBgBody: '#f5f5f7',
      colorBgTrigger: 'rgba(0, 0, 0, 0.04)',
    },

    // ===== Typography =====
    Typography: {
      colorText: 'rgba(0, 0, 0, 0.8)',
      colorTextSecondary: 'rgba(0, 0, 0, 0.48)',
      colorTextTertiary: 'rgba(0, 0, 0, 0.32)',
      colorTextQuaternary: 'rgba(0, 0, 0, 0.16)',
      colorLink: '#0066cc',
      colorLinkHover: '#0071e3',
      colorLinkActive: '#006ed6',
      fontSize: 14,
      fontSizeLG: 16,
      fontSizeSM: 12,
      lineHeight: 1.47,
      lineHeightLG: 1.5,
      lineHeightSM: 1.33,
    },
  },
};

export default appleTheme;