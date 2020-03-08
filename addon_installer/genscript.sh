mkdir -p tmp
rm -rf tmp/*
mkdir -p tmp/hap
mkdir -p tmp/www

# copy all relevant stuff
cp -a update_script tmp/
cp -a rc.d tmp/
cp -a VERSION tmp/www/
cp -a etc tmp/hap

# generate archive
cd tmp
tar --exclude=._* -czvf ../hap-raspb-$(cat ../VERSION).tar.gz *
cd ..
rm -rf tmp
