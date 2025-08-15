@echo off
echo Updating CircleBuy Git Repository...

git add .
git commit -m "feat: Complete real-time marketplace with messaging, mark-as-sold, and all features working"
git push origin main

echo Git update complete!
pause