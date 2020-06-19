echo 'rebuilding..'
yarn prepublish
echo 'copying built js..'
cp -r ./build ~/git/otp-react-redux/node_modules/transitive-js
echo 'done'
