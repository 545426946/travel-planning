-- 后台管理系统数据库扩展
-- 在现有数据库基础上添加管理员功能支持

-- 1. 添加管理员角色字段到用户表
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 2. 创建管理员账户（如果需要预设管理员）
-- 注意：在实际环境中，请修改密码为安全的哈希值
-- INSERT INTO profiles (username, email, role) VALUES 
-- ('admin', 'admin@travelplanner.com', 'admin');

-- 3. 修改行级安全策略以支持管理员权限
-- 管理员可以查看和修改所有用户数据
CREATE POLICY IF NOT EXISTS "管理员可以查看所有用户资料" ON profiles FOR SELECT 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') OR auth.uid() = id);

CREATE POLICY IF NOT EXISTS "管理员可以修改所有用户资料" ON profiles FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') OR auth.uid() = id);

-- 4. 为管理员创建特殊权限策略
-- 管理员可以查看所有行程计划
CREATE POLICY IF NOT EXISTS "管理员可以查看所有行程" ON travel_plans FOR SELECT 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') OR auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "管理员可以修改所有行程" ON travel_plans FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') OR auth.uid() = user_id);

-- 5. 创建用于后台管理的数据库函数

-- 获取所有用户信息（管理员专用）
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    email VARCHAR,
    university VARCHAR,
    role VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查当前用户是否为管理员
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION '权限不足：需要管理员权限';
    END IF;
    
    RETURN QUERY 
    SELECT 
        p.id,
        p.username,
        p.email,
        p.university,
        p.role,
        p.created_at,
        p.updated_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- 获取所有景点信息（管理员专用）
CREATE OR REPLACE FUNCTION get_all_attractions()
RETURNS TABLE (
    attraction_id UUID,
    name VARCHAR,
    location VARCHAR,
    country VARCHAR,
    region VARCHAR,
    type VARCHAR,
    description TEXT,
    entry_fee DECIMAL,
    rating DECIMAL,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查当前用户是否为管理员
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION '权限不足：需要管理员权限';
    END IF;
    
    RETURN QUERY 
    SELECT 
        a.id,
        a.name,
        a.location,
        a.country,
        a.region,
        a.type,
        a.description,
        a.entry_fee,
        a.rating,
        a.created_at
    FROM attractions a
    ORDER BY a.created_at DESC;
END;
$$;

-- 更新用户角色（管理员专用）
CREATE OR REPLACE FUNCTION update_user_role(
    p_user_id UUID,
    p_role VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查当前用户是否为管理员
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION '权限不足：需要管理员权限';
    END IF;
    
    -- 检查目标用户是否存在
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION '用户不存在';
    END IF;
    
    -- 更新用户角色
    UPDATE profiles 
    SET role = p_role, updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$;

-- 删除用户（管理员专用）
CREATE OR REPLACE FUNCTION delete_user(
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查当前用户是否为管理员
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION '权限不足：需要管理员权限';
    END IF;
    
    -- 防止管理员删除自己
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION '不能删除自己的账户';
    END IF;
    
    -- 删除用户
    DELETE FROM profiles WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$;

-- 更新景点信息（管理员专用）
CREATE OR REPLACE FUNCTION update_attraction(
    p_attraction_id UUID,
    p_name VARCHAR,
    p_location VARCHAR,
    p_country VARCHAR,
    p_region VARCHAR,
    p_type VARCHAR,
    p_description TEXT,
    p_entry_fee DECIMAL,
    p_rating DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查当前用户是否为管理员
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION '权限不足：需要管理员权限';
    END IF;
    
    -- 更新景点信息
    UPDATE attractions 
    SET 
        name = p_name,
        location = p_location,
        country = p_country,
        region = p_region,
        type = p_type,
        description = p_description,
        entry_fee = p_entry_fee,
        rating = p_rating
    WHERE id = p_attraction_id;
    
    RETURN TRUE;
END;
$$;

-- 删除景点（管理员专用）
CREATE OR REPLACE FUNCTION delete_attraction(
    p_attraction_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查当前用户是否为管理员
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION '权限不足：需要管理员权限';
    END IF;
    
    -- 删除景点
    DELETE FROM attractions WHERE id = p_attraction_id;
    
    RETURN TRUE;
END;
$$;

-- 创建新景点（管理员专用）
CREATE OR REPLACE FUNCTION create_attraction(
    p_name VARCHAR,
    p_location VARCHAR,
    p_country VARCHAR,
    p_region VARCHAR,
    p_type VARCHAR,
    p_description TEXT,
    p_best_time_to_visit VARCHAR,
    p_entry_fee DECIMAL,
    p_image_url TEXT,
    p_tags VARCHAR[],
    p_rating DECIMAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_attraction_id UUID;
BEGIN
    -- 检查当前用户是否为管理员
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION '权限不足：需要管理员权限';
    END IF;
    
    -- 创建新景点
    INSERT INTO attractions (
        name, location, country, region, type, description, 
        best_time_to_visit, entry_fee, image_url, tags, rating
    ) VALUES (
        p_name, p_location, p_country, p_region, p_type, p_description,
        p_best_time_to_visit, p_entry_fee, p_image_url, p_tags, p_rating
    ) RETURNING id INTO new_attraction_id;
    
    RETURN new_attraction_id;
END;
$$;

-- 注释：在执行此脚本后，需要在Supabase中为管理员账户设置正确的角色