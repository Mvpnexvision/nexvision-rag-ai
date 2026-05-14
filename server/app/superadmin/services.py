from core.supabase_client import get_supabase_client


async def get_all_companies_with_details():
    """Get all companies with status and admin info derived from users table"""
    sb = get_supabase_client()
    
    # Get all companies
    companies_result = sb.table("companies").select("id, company_name, business_line").order("company_name").execute()
    
    companies_list = []
    
    if companies_result.data:
        for company in companies_result.data:
            company_id = company.get("id")
            
            # Count total users in company
            users_result = sb.table("users").select("id", count="exact").eq("company_id", company_id).execute()
            user_count = len(users_result.data) if users_result.data else 0
            
            # Get admin users for this company
            admin_result = sb.table("users").select("id, name, status").eq("company_id", company_id).eq("role", "admin").execute()
            
            # Determine status and admin name
            admin_name = "Unassigned"
            status = "Inactive"
            
            if admin_result.data:
                # Find active admin
                for admin in admin_result.data:
                    if admin.get("status") == "active":
                        admin_name = admin.get("name", "Unknown")
                        status = "Active"
                        break
                
                # Fallback to first admin if none active
                if status == "Inactive" and admin_result.data:
                    admin_name = admin_result.data[0].get("name", "Unknown")
            
            companies_list.append({
                "id": company_id,
                "company_name": company.get("company_name"),
                "business_line": company.get("business_line"),
                "users": user_count,
                "status": status,
                "admin": admin_name,
            })
    
    return companies_list


async def get_company_by_id(company_id: str):
    """Get single company details"""
    sb = get_supabase_client()
    
    # Get company
    company_result = sb.table("companies").select("id, company_name, business_line").eq("id", company_id).execute()
    
    if not company_result.data:
        return None
    
    company = company_result.data[0]
    
    # Count users
    users_result = sb.table("users").select("id", count="exact").eq("company_id", company_id).execute()
    user_count = len(users_result.data) if users_result.data else 0
    
    # Get admin
    admin_result = sb.table("users").select("id, name, status").eq("company_id", company_id).eq("role", "admin").execute()
    
    admin_name = "Unassigned"
    status = "Inactive"
    
    if admin_result.data:
        for admin in admin_result.data:
            if admin.get("status") == "active":
                admin_name = admin.get("name", "Unknown")
                status = "Active"
                break
        
        if status == "Inactive" and admin_result.data:
            admin_name = admin_result.data[0].get("name", "Unknown")
    
    return {
        "id": company_id,
        "company_name": company.get("company_name"),
        "business_line": company.get("business_line"),
        "users": user_count,
        "status": status,
        "admin": admin_name,
    }


async def create_company(name: str, business_line: str):
    """Create new company"""
    sb = get_supabase_client()
    
    result = sb.table("companies").insert({
        "company_name": name,
        "business_line": business_line,
    }).execute()
    
    if not result.data:
        raise Exception("Failed to create company")
    
    company_id = result.data[0].get("id")
    
    # Return created company
    return await get_company_by_id(company_id)


async def update_company(company_id: str, name: str = None, business_line: str = None, status: str = None, admin_id: str = None):
    """Update company details"""
    sb = get_supabase_client()
    
    update_data = {}
    
    if name:
        update_data["company_name"] = name
    if business_line:
        update_data["business_line"] = business_line
    
    # If status is being updated, update admin user status
    if status:
        # Get current admin
        admin_result = sb.table("users").select("id").eq("company_id", company_id).eq("role", "admin").execute()
        
        if admin_result.data:
            admin_user_id = admin_result.data[0].get("id")
            new_status = "active" if status == "Active" else "inactive"
            
            sb.table("users").update({
                "status": new_status
            }).eq("id", admin_user_id).execute()
    
    # Update company table if there's data to update
    if update_data:
        sb.table("companies").update(update_data).eq("id", company_id).execute()
    
    # Return updated company
    return await get_company_by_id(company_id)
