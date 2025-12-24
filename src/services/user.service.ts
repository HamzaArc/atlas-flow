import { supabase } from '@/lib/supabase';
import { CompanyUser, CompanyRole, UserStatus, UserDepartment } from '@/types/index';

// DB Mapper
const mapRowToUser = (row: any): CompanyUser => ({
    id: row.id,
    created_at: row.created_at,
    email: row.email,
    fullName: row.full_name,
    role: row.role as CompanyRole,
    department: row.department as UserDepartment,
    jobTitle: row.job_title,
    status: row.status as UserStatus,
    avatarUrl: row.avatar_url,
    phone: row.phone
});

const mapUserToRow = (user: CompanyUser) => ({
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    department: user.department,
    job_title: user.jobTitle,
    status: user.status,
    avatar_url: user.avatarUrl,
    phone: user.phone
});

export const UserService = {
    fetchAll: async (): Promise<CompanyUser[]> => {
        const { data, error } = await supabase
            .from('company_users')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw new Error(error.message);
        return (data || []).map(mapRowToUser);
    },

    save: async (user: CompanyUser): Promise<CompanyUser> => {
        const payload = mapUserToRow(user);
        const isNew = !user.id || user.id.startsWith('new-');

        let result;
        if (isNew) {
            result = await supabase.from('company_users').insert([payload]).select().single();
        } else {
            result = await supabase.from('company_users').update(payload).eq('id', user.id).select().single();
        }

        if (result.error) throw new Error(result.error.message);
        return mapRowToUser(result.data);
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase.from('company_users').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    createEmpty: (): CompanyUser => ({
        id: `new-${Date.now()}`,
        created_at: new Date().toISOString(),
        email: '',
        fullName: '',
        role: 'SALES',
        department: 'COMMERCIAL',
        status: 'INVITED',
        jobTitle: ''
    })
};