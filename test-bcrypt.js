const bcrypt = require("bcryptjs");

async function main() {
    const hash = "$2b$12$lr/yTVCe0K4J6vfD7v9VpOPR7C.od.UWDOArDpDD968iQtbg2a5SG";
    const pass = "admin";
    const match = await bcrypt.compare(pass, hash);
    console.log("Admin Match:", match);
    
    // Check if generating hash for "admin" works
    const newHash = await bcrypt.hash(pass, 12);
    console.log("New Hash for admin:", newHash);
}

main();
