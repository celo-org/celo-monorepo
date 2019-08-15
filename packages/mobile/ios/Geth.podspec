Pod::Spec.new do |s|
  s.name             = 'Geth'
  s.version         = '0.0.1'
  s.license         =  { :type => 'BSD' }
  s.homepage         = 'http://www.telerik.com/ios-ui'
  s.authors         = { 'John Smith' => 'john.smith@telerik.com' }
  s.summary         = 'A cocoa pod containing the TelerikUI framework.'
  s.source           =  { :path => './Geth.framework' }
  s.vendored_frameworks = 'Geth.framework'
  s.static_framework = true
end
