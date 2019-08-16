Pod::Spec.new do |s|
  s.name             = 'Geth'
  s.version         = '0.0.1'
  s.license         =  { :type => 'BSD' }
  s.homepage         = 'http://www.telerik.com/ios-ui'
  s.authors         = { 'John Smith' => 'john.smith@telerik.com' }
  s.summary         = 'A cocoa pod containing the TelerikUI framework.'
  s.vendored_frameworks = 'build/bin/Geth.framework'
  s.vendored_libraries = 'vendor/github.com/celo-org/bls-zexe/bls/target/universal/release/libbls_zexe.a'
  s.static_framework = true
end
