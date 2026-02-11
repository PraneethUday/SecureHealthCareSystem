# 🔧 Forgot Password Email Not Received - Troubleshooting

## 🔍 **Diagnosis Steps**

### **Step 1: Check Supabase Email Configuration**

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Email Templates**
4. Check **"Reset Password"** template:
   - ✅ Is it **enabled**?
   - ✅ Is the template configured?

---

### **Step 2: Check SMTP Settings**

1. In Supabase Dashboard, go to **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Check if custom SMTP is configured

**Common Issue:** Supabase's default email service has rate limits and may not work reliably.

---

### **Step 3: Configure Custom SMTP (Gmail)**

To ensure emails are sent reliably, configure custom SMTP:

#### **In Supabase Dashboard:**

1. Go to **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Enable **"Enable Custom SMTP"**
4. Fill in these details:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: securehealthcare4@gmail.com
SMTP Password: vlkevljyigwuzxma
Sender Email: securehealthcare4@gmail.com
Sender Name: SecureHealthCare
```

5. Click **Save**

---

### **Step 4: Test the Email**

After configuring SMTP:

1. Go to: http://localhost:3000/forgot-password
2. Enter a **registered email** (check Supabase Dashboard → Authentication → Users)
3. Submit
4. Check:
   - ✅ Inbox
   - ✅ Spam/Junk folder
   - ✅ Promotions tab (Gmail)

---

### **Step 5: Check Server Logs**

Look for errors in your terminal:

```bash
# Look for lines like:
[Forgot Password] Processing request for: email@example.com
[Forgot Password] ✅ Reset email sent via Supabase Auth
```

Or errors like:
```bash
[Forgot Password] Supabase error: ...
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Email Not Registered**

**Symptom:** No email received  
**Cause:** Email doesn't exist in Supabase Auth  

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Check if the email exists
3. If not, register the user first

---

### **Issue 2: Supabase Default Email Service**

**Symptom:** Emails delayed or not sent  
**Cause:** Supabase's default email has rate limits  

**Solution:**
- Configure custom SMTP (see Step 3 above)

---

### **Issue 3: Email Template Disabled**

**Symptom:** No email sent  
**Cause:** Reset password template is disabled  

**Solution:**
1. Supabase Dashboard → Authentication → Email Templates
2. Find "Reset Password"
3. Click **Enable**

---

### **Issue 4: Wrong Redirect URL**

**Symptom:** Email sent but link doesn't work  
**Cause:** Redirect URL is incorrect  

**Solution:**
Check `.env` file:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Make sure this matches your dev server URL.

---

## ✅ **Quick Fix (Recommended)**

### **Configure Custom SMTP in Supabase:**

1. **Supabase Dashboard** → **Project Settings** → **Authentication**
2. Enable **Custom SMTP**
3. Use these settings:

```
Host: smtp.gmail.com
Port: 587
User: securehealthcare4@gmail.com
Password: vlkevljyigwuzxma
From: securehealthcare4@gmail.com
```

4. **Save**
5. **Test again!**

---

## 🧪 **Test Checklist**

- [ ] Email exists in Supabase Auth Users
- [ ] SMTP configured in Supabase
- [ ] Reset Password template enabled
- [ ] Server is running (`npm run dev`)
- [ ] Checked spam folder
- [ ] Checked server console for errors
- [ ] Tried with different email
- [ ] Waited 2-3 minutes (sometimes delayed)

---

## 📧 **Alternative: Check Supabase Email Logs**

1. Supabase Dashboard → **Logs**
2. Filter by **"auth"**
3. Look for password reset events
4. Check for errors

---

## 💡 **Pro Tip**

**If Supabase emails are unreliable, you can create a custom email implementation:**

I can create a custom forgot password email sender using your Gmail SMTP directly (like the appointment emails). This gives you full control.

**Would you like me to create a custom email implementation?**

---

## 🎯 **Most Likely Solution**

**Configure Custom SMTP in Supabase Dashboard!**

This is the #1 reason for missing password reset emails. Supabase's default email service is limited and unreliable for development.

---

**After configuring SMTP, test again and let me know!** 📧✨
