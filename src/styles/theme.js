import {
  createTheme,
  alpha,
  getContrastRatio,
  responsiveFontSizes,
} from '@mui/material/styles'

const brand = {
  cyan: '#06aee9',
  cyanDark: '#0284b8',
  cyanDeep: '#0369a1',
  wash: '#c8eef8',
  washSoft: '#e7f7fc',
  canvas: '#eef5f8',
  ink: '#123047',
  muted: '#5a7384',
  border: '#cfe4ee',
  surface: '#ffffff',
}

const violetBase = '#7F00FF'
const violetMain = alpha(violetBase, 0.7)

let theme = createTheme()

const salmon = theme.palette.augmentColor({
  color: {
    main: '#FF5733',
  },
  name: 'salmon',
})

theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.cyan,
      light: '#4ec8f0',
      dark: brand.cyanDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brand.wash,
      light: brand.washSoft,
      dark: '#8fd8ee',
      contrastText: brand.cyanDark,
    },
    background: {
      default: brand.canvas,
      paper: brand.surface,
    },
    text: {
      primary: brand.ink,
      secondary: brand.muted,
    },
    divider: brand.border,
    success: {
      main: '#0f9d6e',
      light: '#e8f8f2',
      dark: '#0b7a56',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d97706',
      light: '#fef6e6',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc3b3b',
      light: '#fdecec',
      dark: '#b42318',
      contrastText: '#ffffff',
    },
    info: {
      main: brand.cyan,
      light: brand.washSoft,
      dark: brand.cyanDark,
      contrastText: '#ffffff',
    },
    button: {
      main: brand.wash,
    },
    description: {
      primary: brand.muted,
    },
    ochre: {
      main: '#E3D026',
      light: '#E9DB5D',
      dark: '#A29415',
      contrastText: '#242105',
    },
    violet: {
      main: violetMain,
      light: alpha(violetBase, 0.5),
      dark: alpha(violetBase, 0.9),
      contrastText:
        getContrastRatio(violetMain, '#fff') > 4.5 ? '#fff' : '#111',
    },
    salmon,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.03em', color: brand.ink },
    h2: { fontWeight: 700, letterSpacing: '-0.03em', color: brand.ink },
    h3: { fontWeight: 700, letterSpacing: '-0.02em', color: brand.ink },
    h4: { fontWeight: 700, letterSpacing: '-0.02em', color: brand.ink },
    h5: { fontWeight: 600, letterSpacing: '-0.015em', color: brand.ink },
    h6: { fontWeight: 600, letterSpacing: '-0.01em', color: brand.ink },
    subtitle1: { fontWeight: 600, color: brand.ink },
    subtitle2: { fontWeight: 600, color: brand.muted },
    body1: { color: brand.ink },
    body2: { color: brand.muted },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0,
    },
  },
  shadows: [
    'none',
    '0 1px 2px rgba(18, 48, 71, 0.05)',
    '0 2px 8px rgba(18, 48, 71, 0.06)',
    '0 8px 24px rgba(18, 48, 71, 0.08)',
    '0 16px 40px rgba(18, 48, 71, 0.12)',
    '0 24px 48px rgba(18, 48, 71, 0.14)',
    ...Array(19).fill('0 16px 40px rgba(18, 48, 71, 0.12)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brand.canvas,
          color: brand.ink,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 40,
          paddingInline: 16,
        },
        containedPrimary: {
          background: `linear-gradient(180deg, ${brand.cyan} 0%, ${brand.cyanDark} 100%)`,
          boxShadow: '0 6px 16px rgba(6, 174, 233, 0.28)',
          '&:hover': {
            background: `linear-gradient(180deg, #1bb8ee 0%, ${brand.cyanDeep} 100%)`,
            boxShadow: '0 8px 20px rgba(6, 174, 233, 0.34)',
          },
        },
        outlined: {
          borderColor: brand.border,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: brand.surface,
          borderRadius: 10,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(brand.cyan, 0.55),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.cyan,
            borderWidth: 1.5,
          },
        },
        notchedOutline: {
          borderColor: brand.border,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: brand.muted,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 14,
        },
        elevation1: {
          boxShadow: '0 2px 10px rgba(18, 48, 71, 0.06)',
          border: `1px solid ${brand.border}`,
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        fullWidth: true,
        scroll: 'paper',
      },
      styleOverrides: {
        paper: {
          borderRadius: 16,
          maxHeight: '88vh',
          width: 'min(100%, 920px)',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(18, 48, 71, 0.22)',
          border: `1px solid ${brand.border}`,
        },
        paperWidthXs: { width: 'min(100%, 420px)' },
        paperWidthSm: { width: 'min(100%, 560px)' },
        paperWidthMd: { width: 'min(100%, 760px)' },
        paperWidthLg: { width: 'min(100%, 980px)' },
        paperWidthXl: { width: 'min(100%, 1180px)' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1.05rem',
          color: brand.ink,
          padding: '14px 20px',
          borderBottom: `1px solid ${brand.border}`,
          background: `linear-gradient(180deg, ${brand.washSoft} 0%, ${brand.surface} 100%)`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '18px 20px',
          maxHeight: 'calc(88vh - 128px)',
        },
        dividers: {
          borderColor: brand.border,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px 16px',
          borderTop: `1px solid ${brand.border}`,
          background: brand.washSoft,
          gap: 8,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 28, 42, 0.48)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderLeft: `1px solid ${brand.border}`,
          boxShadow: '-16px 0 40px rgba(18, 48, 71, 0.12)',
          maxWidth: 'min(520px, 92vw)',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${brand.border}`,
          boxShadow: '0 12px 32px rgba(18, 48, 71, 0.14)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${brand.border}`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 6px',
          '&:hover': {
            backgroundColor: brand.washSoft,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brand.ink,
          fontSize: 12,
          borderRadius: 8,
          padding: '6px 10px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 44,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        colorPrimary: {
          color: brand.cyanDark,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${brand.border}`,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${brand.border}`,
          borderRadius: 12,
          backgroundColor: brand.surface,
          fontFamily: '"DM Sans", "Segoe UI", sans-serif',
          '--DataGrid-containerBackground': brand.washSoft,
        },
        columnHeaders: {
          backgroundColor: brand.washSoft,
          borderBottom: `1px solid ${brand.border}`,
          color: brand.ink,
          fontWeight: 700,
        },
        columnHeaderTitle: {
          fontWeight: 800,
          color: brand.ink,
          fontSize: 13,
        },
        cell: {
          borderColor: alpha(brand.border, 0.8),
          color: brand.ink,
          fontWeight: 600,
          fontSize: 14,
        },
        cellContent: {
          color: brand.ink,
          fontWeight: 600,
        },
        row: {
          '&:hover': {
            backgroundColor: alpha(brand.cyan, 0.06),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(brand.cyan, 0.1),
            '&:hover': {
              backgroundColor: alpha(brand.cyan, 0.14),
            },
          },
        },
        footerContainer: {
          borderTop: `1px solid ${brand.border}`,
          backgroundColor: brand.washSoft,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: brand.washSoft,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: brand.ink,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${brand.border}`,
          boxShadow: 'none',
          '&:before': { display: 'none' },
        },
      },
    },
  },
})

theme = responsiveFontSizes(theme)

export default theme
