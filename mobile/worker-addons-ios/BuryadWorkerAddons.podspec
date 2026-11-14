Pod::Spec.new do |s|
  s.name = 'BuryadWorkerAddons'
  s.version = '1.0.0'
  s.summary = 'iOS native addons required by the Buryad Ugenuud Bare worker.'
  s.homepage = 'https://github.com/ErdemRodionovich/buryad_ugenuud_worker'
  s.license = { :type => 'Apache-2.0' }
  s.author = 'Buryad Ugenuud'
  s.source = {
    :git => 'https://github.com/ErdemRodionovich/buryad_ugenuud_worker.git',
    :tag => s.version.to_s
  }
  s.platform = :ios, '15.1'
  s.vendored_frameworks = 'Frameworks/*.xcframework'
end