const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seed() {
  const users = [
    { email: 'student@test.com', password: 'password123', role: 'STUDENT' },
    { email: 'admin@test.com', password: 'password123', role: 'ADMIN' },
    { email: 'mentor@test.com', password: 'password123', role: 'MENTOR' },
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
    });
    console.log(`Signup result for ${u.email}:`, data.user ? data.user.id : 'No user ID');
    if (error) console.error(`Error for ${u.email}:`, error.message);
  }
}

seed();
