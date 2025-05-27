import { supabase } from '@/integrations/supabase/client';

export const debugAdminSystem = async (userEmail: string = 't.krishnadeepak@gmail.com') => {
  console.log('🔍 Starting Admin System Debug...');
  console.log('=====================================');

  try {
    // Step 1: Check if admin tables exist
    console.log('\n1️⃣ Checking Admin Tables...');

    // Test admin_users table with simple query
    const { data: adminUsersTest, error: adminUsersError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (adminUsersError) {
      console.error('❌ Error accessing admin_users table:', {
        message: adminUsersError.message,
        details: adminUsersError.details,
        hint: adminUsersError.hint,
        code: adminUsersError.code
      });
    } else {
      console.log('✅ admin_users table accessible');
    }

    // Test other tables individually with simple queries
    const tablesToTest = ['admin_activity_logs', 'user_login_history', 'user_status_changes'];
    for (const tableName of tablesToTest) {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error) {
        console.error(`❌ Error accessing ${tableName}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else {
        console.log(`✅ ${tableName} table accessible`);
      }
    }

    // Step 2: Check auth user exists
    console.log('\n2️⃣ Checking Auth User...');

    // First try to get current session user
    const { data: session, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Error getting session:', {
        message: sessionError.message,
        details: sessionError
      });
      return;
    }

    if (!session.session?.user) {
      console.error('❌ No active session found');
      return;
    }

    const authUser = session.session.user;
    console.log('✅ Auth user from session:', {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at
    });

    // Verify this matches the target email
    if (authUser.email !== userEmail) {
      console.warn(`⚠️ Session user (${authUser.email}) does not match target (${userEmail})`);
    }

    // Step 3: Check admin user record
    console.log('\n3️⃣ Checking Admin User Record...');

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (adminError) {
      console.error('❌ Error finding admin user:', {
        message: adminError.message,
        details: adminError.details,
        hint: adminError.hint,
        code: adminError.code
      });

      // Try to create admin user if it doesn't exist
      console.log('🔧 Attempting to create admin user...');
      const { data: newAdminUser, error: createError } = await supabase
        .from('admin_users')
        .insert({
          user_id: authUser.id,
          role: 'super_admin',
          created_by: authUser.id,
          permissions: { all: true },
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating admin user:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        });
      } else {
        console.log('✅ Admin user created:', newAdminUser);
      }
    } else {
      console.log('✅ Admin user found:', {
        id: adminUser.id,
        user_id: adminUser.user_id,
        role: adminUser.role,
        is_active: adminUser.is_active,
        permissions: adminUser.permissions
      });
    }

    // Step 4: Test admin permission function
    console.log('\n4️⃣ Testing Admin Permission Function...');

    try {
      const { data: permissionResult, error: permissionError } = await supabase
        .rpc('check_admin_permission', {
          p_user_id: authUser.id,
          p_required_role: 'super_admin'
        });

      if (permissionError) {
        console.error('❌ Error checking permissions:', {
          message: permissionError.message,
          details: permissionError.details,
          hint: permissionError.hint,
          code: permissionError.code
        });
      } else {
        console.log('✅ Permission check result:', permissionResult);
      }
    } catch (funcError) {
      console.error('❌ Admin permission function not found:', {
        message: funcError instanceof Error ? funcError.message : 'Unknown error',
        error: funcError
      });
    }

    // Step 5: Check current session
    console.log('\n5️⃣ Checking Current Session...');

    const { data: currentSession, error: currentSessionError } = await supabase.auth.getSession();

    if (currentSessionError) {
      console.error('❌ Error getting session:', {
        message: currentSessionError.message,
        details: currentSessionError.details,
        hint: currentSessionError.hint,
        code: currentSessionError.code
      });
    } else if (!currentSession.session) {
      console.warn('⚠️ No active session found');
    } else {
      console.log('✅ Active session found:', {
        user_id: currentSession.session.user.id,
        email: currentSession.session.user.email,
        expires_at: currentSession.session.expires_at
      });

      // Check if session user matches our target user
      if (currentSession.session.user.id === authUser.id) {
        console.log('✅ Session user matches target admin user');
      } else {
        console.warn('⚠️ Session user does not match target admin user');
      }
    }

    // Step 6: Test direct admin query with current session
    console.log('\n6️⃣ Testing Admin Query with Current Session...');

    const { data: sessionAdminUser, error: sessionAdminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('is_active', true)
      .single();

    if (sessionAdminError) {
      console.error('❌ Error querying admin with session:', {
        message: sessionAdminError.message,
        details: sessionAdminError.details,
        hint: sessionAdminError.hint,
        code: sessionAdminError.code
      });
    } else {
      console.log('✅ Admin user found with session:', sessionAdminUser);
    }

    // Step 7: Test admin permission function (safer than checking policies directly)
    console.log('\n7️⃣ Testing Admin Permissions...');

    try {
      const { data: hasPermission, error: permError } = await supabase
        .rpc('check_admin_permission', {
          p_user_id: authUser.id,
          p_required_role: 'admin'
        });

      if (permError) {
        console.error('❌ Error checking admin permissions:', {
          message: permError.message,
          details: permError.details,
          hint: permError.hint,
          code: permError.code
        });
      } else {
        console.log('✅ Admin permission check result:', hasPermission);
      }
    } catch (funcError) {
      console.log('⚠️ Admin permission function not available - this is normal');
    }

  } catch (error) {
    console.error('💥 Unexpected error during debug:', error);
  }

  console.log('\n=====================================');
  console.log('🔍 Admin System Debug Complete');
};

// Helper function to test admin context manually
export const testAdminContext = async () => {
  console.log('🧪 Testing Admin Context Logic...');

  try {
    const { data: session } = await supabase.auth.getSession();

    if (!session.session?.user) {
      console.log('❌ No user session found');
      return null;
    }

    const user = session.session.user;
    console.log('👤 Current user:', user.email);

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Admin query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('✅ Admin user found:', adminUser);
    return adminUser;
  } catch (error) {
    console.error('💥 Error in admin context test:', error);
    return null;
  }
};

// Function to manually create admin user
export const createAdminUser = async (userEmail: string, role: string = 'super_admin') => {
  console.log(`🔧 Creating admin user for ${userEmail}...`);

  try {
    // Get current session user instead of querying auth.users directly
    const { data: session, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session.session?.user) {
      console.error('❌ No active session found');
      return;
    }

    const authUser = session.session.user;

    // Verify the email matches
    if (authUser.email !== userEmail) {
      console.error(`❌ Session user email (${authUser.email}) does not match target email (${userEmail})`);
      return;
    }

    console.log(`✅ Using session user: ${authUser.email}`);

    // Use the create_initial_admin function instead of direct insert
    const { data: result, error: createError } = await supabase
      .rpc('create_initial_admin', {
        p_email: userEmail,
        p_role: role
      });

    if (createError) {
      console.error('❌ Error creating admin user:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code
      });
    } else {
      console.log('✅ Admin user creation result:', result);
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
};
