import React from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  Fade,
  Backdrop
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function DeleteConfirmationModal({ open, onClose, onDeleteSingle, onDeleteAll }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Delete Recurring Transaction
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            Delete all recurring transactions going forward?
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button 
              variant="outlined" 
              onClick={onDeleteSingle} 
              color="primary"
            >
              Delete only this transaction
            </Button>
            <Button 
              variant="contained" 
              onClick={onDeleteAll} 
              color="error"
            >
              Delete all transactions
            </Button>
          </Stack>
        </Box>
      </Fade>
    </Modal>
  );
}

export default DeleteConfirmationModal; 