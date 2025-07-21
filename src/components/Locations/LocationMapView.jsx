import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Group as GroupIcon,
  Movie as MovieIcon
} from '@mui/icons-material';

/**
 * LocationMapView 컴포넌트
 * LocationGroup별 실제 주소를 지도에 표시하고, 지도 마커 클릭 시 해당 그룹의 가상장소 목록과 연동
 */
const LocationMapView = ({
  projectId,
  locationGroups,
  virtualLocations,
  onGroupSelect
}) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 그룹 선택 핸들러
  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    onGroupSelect?.(group);
  };

  // 그룹별 가상장소 필터링
  const getVirtualLocationsByGroup = (groupId) => {
    return virtualLocations.filter(location => location.locationGroupId === groupId);
  };

  // 지도 컴포넌트 (실제 구현에서는 Google Maps API 사용)
  const MapComponent = () => {
    useEffect(() => {
      // Google Maps API 로드 및 초기화
      const loadMap = () => {
        // 실제 구현에서는 Google Maps API를 사용
        // 현재는 플레이스홀더로 표시
        setTimeout(() => setMapLoaded(true), 1000);
      };

      loadMap();
    }, []);

    if (!mapLoaded) {
      return (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="400px"
          bgcolor="grey.100"
          borderRadius={1}
        >
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box 
        height="400px" 
        bgcolor="grey.200" 
        borderRadius={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
      >
        <Typography variant="h6" color="text.secondary">
          🗺️ 지도 영역
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ position: 'absolute', bottom: 16 }}>
          Google Maps API 연동 예정
        </Typography>
        
        {/* 가상 마커들 */}
        {locationGroups.map((group, index) => (
          <Box
            key={group._id}
            sx={{
              position: 'absolute',
              left: `${20 + (index * 15)}%`,
              top: `${30 + (index * 10)}%`,
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }}
            onClick={() => handleGroupSelect(group)}
          >
            <LocationIcon 
              color={selectedGroup?._id === group._id ? "primary" : "action"}
              sx={{ fontSize: 32 }}
            />
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, height: '600px' }}>
      {/* 지도 영역 */}
      <Box sx={{ flex: 2 }}>
        <Typography variant="h6" gutterBottom>
          📍 촬영 장소 지도
        </Typography>
        <MapComponent />
      </Box>

      {/* 선택된 그룹 정보 */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" gutterBottom>
          📋 장소 정보
        </Typography>
        
        {selectedGroup ? (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {selectedGroup.name}
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {selectedGroup.realAddress}
                </Typography>
              </Box>

              {/* 주소 상세 정보 */}
              {(selectedGroup.addressDetails?.city || selectedGroup.addressDetails?.district) && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedGroup.addressDetails.city} {selectedGroup.addressDetails.district}
                    {selectedGroup.addressDetails.postalCode && ` (${selectedGroup.addressDetails.postalCode})`}
                  </Typography>
                </Box>
              )}

              {/* 촬영 정보 */}
              {selectedGroup.shootingInfo && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    촬영 정보
                  </Typography>
                  {selectedGroup.shootingInfo.contactPerson && (
                    <Typography variant="body2" color="text.secondary">
                      담당자: {selectedGroup.shootingInfo.contactPerson}
                    </Typography>
                  )}
                  {selectedGroup.shootingInfo.contactPhone && (
                    <Typography variant="body2" color="text.secondary">
                      연락처: {selectedGroup.shootingInfo.contactPhone}
                    </Typography>
                  )}
                  {selectedGroup.shootingInfo.permissionRequired && (
                    <Chip 
                      label="허가 필요" 
                      size="small" 
                      color="warning" 
                      variant="outlined" 
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              )}

              {/* 가상장소 목록 */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  가상장소 목록
                </Typography>
                <List dense>
                  {getVirtualLocationsByGroup(selectedGroup._id).map((location) => (
                    <ListItem key={location._id} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <MovieIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={location.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {location.description}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5}>
                              <Chip 
                                label={location.shootingInfo?.timeOfDay} 
                                size="small" 
                                variant="outlined" 
                              />
                              <Chip 
                                label={`${location.shootingInfo?.estimatedShootingTime}분`} 
                                size="small" 
                                variant="outlined" 
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {getVirtualLocationsByGroup(selectedGroup._id).length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="가상장소가 없습니다"
                        secondary="가상장소를 추가해주세요"
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              장소를 선택하세요
            </Typography>
            <Typography variant="body2" color="text.secondary">
              지도에서 마커를 클릭하여 장소 정보를 확인하세요
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default LocationMapView; 