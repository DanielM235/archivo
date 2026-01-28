import { type FC, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { IRenameFileInfo } from '@archivo/shared';
import { FileUtils } from '@archivo/shared';

/**
 * Props for FileListView component
 */
export interface IFileListViewProps {
  /**
   * Array of files to display
   */
  files: IRenameFileInfo[];

  /**
   * Whether to show the new name column
   */
  showNewName?: boolean;

  /**
   * Maximum height of the list
   */
  maxHeight?: number | string;

  /**
   * Empty state message
   */
  emptyMessage?: string;

  /**
   * Title for the file list
   */
  title?: string;
}

/**
 * Sort order type
 */
type SortOrder = 'asc' | 'desc';

/**
 * Sortable columns
 */
type SortColumn = 'originalName' | 'extension' | 'size' | 'newName';

/**
 * Get icon for file type
 */
function getFileIcon(extension: string) {
  const type = FileUtils.getFileIconType(extension);
  const iconProps = { fontSize: 'small' as const, sx: { opacity: 0.7 } };

  switch (type) {
    case 'image':
      return <ImageIcon {...iconProps} color="primary" />;
    case 'document':
      return <DescriptionIcon {...iconProps} color="info" />;
    case 'archive':
      return <FolderZipIcon {...iconProps} color="warning" />;
    case 'audio':
      return <AudiotrackIcon {...iconProps} color="secondary" />;
    case 'video':
      return <VideoFileIcon {...iconProps} color="error" />;
    case 'code':
      return <CodeIcon {...iconProps} color="success" />;
    default:
      return <InsertDriveFileIcon {...iconProps} />;
  }
}

/**
 * FileListView component - displays a list of files with their properties
 * Responsive: shows table on desktop, cards on mobile
 */
export const FileListView: FC<IFileListViewProps> = ({
  files,
  showNewName = false,
  maxHeight = 400,
  emptyMessage = 'No files to display',
  title,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('originalName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  /**
   * Handle sort column click
   */
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  /**
   * Filter and sort files
   */
  const displayedFiles = useMemo(() => {
    let result = [...files];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (file) =>
          file.originalName.toLowerCase().includes(query) ||
          file.extension.toLowerCase().includes(query) ||
          (file.newName && file.newName.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let compareA: string | number;
      let compareB: string | number;

      switch (sortColumn) {
        case 'originalName':
          compareA = a.originalName.toLowerCase();
          compareB = b.originalName.toLowerCase();
          break;
        case 'extension':
          compareA = a.extension.toLowerCase();
          compareB = b.extension.toLowerCase();
          break;
        case 'size':
          compareA = a.size;
          compareB = b.size;
          break;
        case 'newName':
          compareA = (a.newName || '').toLowerCase();
          compareB = (b.newName || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [files, searchQuery, sortColumn, sortOrder]);

  /**
   * Render mobile card view
   */
  const renderMobileView = () => (
    <Stack spacing={1.5}>
      {displayedFiles.map((file) => (
        <Card
          key={file.id}
          variant="outlined"
          sx={{
            borderColor: file.error ? 'error.main' : undefined,
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              {getFileIcon(file.extension)}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Tooltip title={file.originalName} arrow placement="top">
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    {file.originalName}
                  </Typography>
                </Tooltip>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <Chip
                    label={file.extension.toUpperCase() || 'N/A'}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {FileUtils.formatFileSize(file.size)}
                  </Typography>
                </Box>
                {showNewName && file.newName && (
                  <Tooltip title={file.newName} arrow placement="top">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 1,
                        color: 'success.main',
                        cursor: 'pointer',
                      }}
                    >
                      <ArrowForwardIcon sx={{ fontSize: 14 }} />
                      <Typography
                        variant="caption"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {file.newName}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
                {file.error && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 1,
                      color: 'error.main',
                    }}
                  >
                    <ErrorOutlineIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption">{file.error}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  /**
   * Render desktop table view
   */
  const renderTableView = () => (
    <TableContainer>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 40 }} />
            <TableCell>
              <TableSortLabel
                active={sortColumn === 'originalName'}
                direction={sortColumn === 'originalName' ? sortOrder : 'asc'}
                onClick={() => handleSort('originalName')}
              >
                Original Name
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ width: 100 }}>
              <TableSortLabel
                active={sortColumn === 'extension'}
                direction={sortColumn === 'extension' ? sortOrder : 'asc'}
                onClick={() => handleSort('extension')}
              >
                Type
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ width: 100 }}>
              <TableSortLabel
                active={sortColumn === 'size'}
                direction={sortColumn === 'size' ? sortOrder : 'asc'}
                onClick={() => handleSort('size')}
              >
                Size
              </TableSortLabel>
            </TableCell>
            {showNewName && (
              <TableCell>
                <TableSortLabel
                  active={sortColumn === 'newName'}
                  direction={sortColumn === 'newName' ? sortOrder : 'asc'}
                  onClick={() => handleSort('newName')}
                >
                  New Name
                </TableSortLabel>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedFiles.map((file) => (
            <TableRow
              key={file.id}
              sx={{
                backgroundColor: file.error ? alpha(theme.palette.error.main, 0.05) : undefined,
                '&:hover': {
                  backgroundColor: file.error
                    ? alpha(theme.palette.error.main, 0.1)
                    : alpha(theme.palette.action.hover, 0.04),
                },
              }}
            >
              <TableCell>{getFileIcon(file.extension)}</TableCell>
              <TableCell>
                <Tooltip title={file.originalName} arrow placement="top-start">
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 400,
                      cursor: 'pointer',
                    }}
                  >
                    {file.originalName}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Chip
                  label={file.extension.toUpperCase() || 'N/A'}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.75rem' }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {FileUtils.formatFileSize(file.size)}
                </Typography>
              </TableCell>
              {showNewName && (
                <TableCell>
                  {file.error ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: 'error.main',
                      }}
                    >
                      <ErrorOutlineIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{file.error}</Typography>
                    </Box>
                  ) : file.newName ? (
                    <Tooltip title={file.newName} arrow placement="top-start">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'success.main',
                          cursor: 'pointer',
                        }}
                      >
                        <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 400,
                          }}
                        >
                          {file.newName}
                        </Typography>
                      </Box>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (files.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: alpha(theme.palette.action.hover, 0.02),
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <InsertDriveFileIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header with title and search */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 2,
        }}
      >
        {title && (
          <Typography variant="h6" component="h3" fontWeight={600}>
            {title}
          </Typography>
        )}
        <TextField
          size="small"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 200, maxWidth: { xs: '100%', sm: 300 } }}
        />
      </Box>

      {/* File count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {displayedFiles.length === files.length
          ? `${files.length} file${files.length !== 1 ? 's' : ''}`
          : `Showing ${displayedFiles.length} of ${files.length} files`}
      </Typography>

      {/* File list */}
      <Paper
        variant="outlined"
        sx={{
          maxHeight,
          overflow: 'auto',
          borderRadius: 2,
        }}
      >
        {isMobile ? <Box sx={{ p: 1.5 }}>{renderMobileView()}</Box> : renderTableView()}
      </Paper>
    </Box>
  );
};
