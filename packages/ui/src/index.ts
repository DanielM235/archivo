/**
 * @archivo/ui
 * Shared UI library for Archivo application
 *
 * This package contains MUI-based components, themes, and styles
 * shared across all platforms (Web & Electron).
 */

// Components
export * from './components';

// Theme
export * from './theme';

// Re-export commonly used MUI components for convenience
export {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Paper,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Chip,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Breadcrumbs,
  Link,
} from '@mui/material';
