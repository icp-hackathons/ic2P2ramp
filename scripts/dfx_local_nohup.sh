nohup dfx start --clean > /dev/null 2>&1 &

ps aux | grep dfx
kill -9 <PID>

rm nohup.out