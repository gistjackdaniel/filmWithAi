import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import LocationGroupList from '../components/Locations/LocationGroupList';
import VirtualLocationList from '../components/Locations/VirtualLocationList';
import LocationMapView from '../components/Locations/LocationMapView';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { locationAPI } from '../services/api';

/**
 * LocationsPage 컴포넌트
 * 가상장소와 실제 장소 매핑을 관리하는 최상위 페이지
 */
const LocationsPage = () => {
  const { projectId } = useParams();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationGroups, setLocationGroups] = useState([]);
  const [virtualLocations, setVirtualLocations] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 데이터 로드
  useEffect(() => {
    if (!projectId || !user) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // LocationGroup과 VirtualLocation 데이터를 병렬로 로드
        const [groupsResponse, locationsResponse] = await Promise.all([
          locationAPI.getLocationGroups(projectId),
          locationAPI.getVirtualLocations(projectId)
        ]);

        setLocationGroups(groupsResponse.data.data || []);
        setVirtualLocations(locationsResponse.data.data || []);
      } catch (err) {
        console.error('LocationsPage 데이터 로드 오류:', err);
        setError(err.response?.data?.message || err.message || '데이터 로드에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, user]);

  // 데이터 새로고침
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // LocationGroup과 VirtualLocation 데이터를 병렬로 로드
      const [groupsResponse, locationsResponse] = await Promise.all([
        locationAPI.getLocationGroups(projectId),
        locationAPI.getVirtualLocations(projectId)
      ]);

      setLocationGroups(groupsResponse.data.data || []);
      setVirtualLocations(locationsResponse.data.data || []);
    } catch (err) {
      console.error('LocationsPage 데이터 새로고침 오류:', err);
      setError(err.response?.data?.message || err.message || '데이터 새로고침에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 그룹 선택 핸들러
  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📍 장소 관리
        </Typography>
        <Typography variant="body1" color="text.secondary">
          가상장소와 실제 촬영 장소를 매핑하고 관리합니다.
        </Typography>
      </Box>

      {/* 탭 네비게이션 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="장소 그룹 관리" 
            icon="🏢" 
            iconPosition="start"
          />
          <Tab 
            label="가상장소 관리" 
            icon="🎬" 
            iconPosition="start"
          />
          <Tab 
            label="지도 보기" 
            icon="🗺️" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* 탭 컨텐츠 */}
      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && (
          <LocationGroupList
            projectId={projectId}
            locationGroups={locationGroups}
            virtualLocations={virtualLocations}
            onDataChange={refreshData}
            onGroupSelect={handleGroupSelect}
            selectedGroup={selectedGroup}
          />
        )}
        
        {activeTab === 1 && (
          <VirtualLocationList
            projectId={projectId}
            locationGroups={locationGroups}
            virtualLocations={virtualLocations}
            onDataChange={refreshData}
            selectedGroup={selectedGroup}
          />
        )}
        
        {activeTab === 2 && (
          <LocationMapView
            projectId={projectId}
            locationGroups={locationGroups}
            virtualLocations={virtualLocations}
            onGroupSelect={handleGroupSelect}
          />
        )}
      </Box>
    </Container>
  );
};

export default LocationsPage; 