import { useAuth } from '../context/AuthContext';
import { Project } from '../types';

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'Admin';

  const getProjectRole = (project: Project): string | null => {
    if (isAdmin) return 'Admin';
    if (!user) return null;
    
    // Check by name or email since we might not have user ID in team member
    const member = project.team?.find(m => m.name === user.name || m.name === user.email);
    return member ? member.projectRole : null;
  };

  const canEditProject = (project: Project): boolean => {
    if (isAdmin) return true;
    const role = getProjectRole(project);
    return role === 'Project Admin' || role === 'Project Lead' || role === 'Project Sponsor' || role === 'Programme Lead' || role === 'Product Owner';
  };

  const canEditProjectFeature = (project: Project): boolean => {
    if (isAdmin) return true;
    const role = getProjectRole(project);
    if (!role) return false;
    // Viewers are read-only
    if (role === 'Viewer') return false;
    return true; // Users can edit features
  };

  const canDeleteProject = (project: Project): boolean => {
    if (isAdmin) return true;
    const role = getProjectRole(project);
    return role === 'Project Admin' || role === 'Project Lead' || role === 'Project Sponsor';
  };

  const canDeleteItems = (project: Project): boolean => {
    if (isAdmin) return true;
    const role = getProjectRole(project);
    return role === 'Project Admin';
  };

  const canManageRecycleBin = (): boolean => {
    return isAdmin;
  };

  const canEditGlobal = (): boolean => {
    return isAdmin;
  };

  const canCreateProject = (): boolean => {
    if (isAdmin) return true;
    if (!user) return false;
    return user.role !== 'Viewer';
  };

  const canEditPersonas = (): boolean => {
    if (isAdmin) return true;
    if (!user) return false;
    return user.role !== 'Viewer';
  };

  return {
    isAdmin,
    getProjectRole,
    canEditProject,
    canEditProjectFeature,
    canDeleteProject,
    canDeleteItems,
    canManageRecycleBin,
    canEditGlobal,
    canCreateProject,
    canEditPersonas
  };
}
